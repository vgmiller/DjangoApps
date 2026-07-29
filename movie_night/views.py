"""
Auth decision: session auth, not JWT.

The original FastAPI app issued its own JWTs (backend/app/auth.py) because it
had no other session mechanism. This Django project already ships
django.contrib.auth + SessionMiddleware for every other app, so movie_night
reuses that instead of bolting on a second, parallel auth system: register/
login call Django's authenticate()/login() to set the standard session
cookie, and every other endpoint uses DRF's SessionAuthentication +
IsAuthenticated. This matches project convention (see naga/hobbits) and
avoids maintaining a JWT secret/expiry story alongside Django sessions.
"""

import smtplib

from botocore.exceptions import ClientError
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import BadHeaderError, send_mail
from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404, render
from django.utils import timezone as django_timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from . import models, serializers, services
from .services import display_name as _display_name

User = get_user_model()


def app(request, *args, **kwargs):
    """Serve the built React SPA for any /movie_night/... route that isn't
    under /movie_night/api/.

    React Router (basename="/movie_night") handles client-side routing
    from there; this view just needs to return the same index.html for
    every sub-path (e.g. /movie_night/groups/1). The captured path segment
    (if any) is irrelevant here since React Router does the actual routing.
    """
    return render(request, "movie_night_app.html")


class MovieNightAPIView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]


class _AuthRateThrottle(AnonRateThrottle):
    """Throttles unauthenticated auth endpoints (register/login/password-reset)
    by IP, to blunt brute-force and mail-bombing attempts. Rate is hardcoded
    here rather than via DEFAULT_THROTTLE_RATES so it doesn't require changes
    to the shared project settings.py.
    """

    scope = "movie_night_auth"
    rate = "10/min"

    def get_rate(self):
        return self.rate


class _ActivityPagination(LimitOffsetPagination):
    default_limit = services.ACTIVITY_LIST_LIMIT


class _MembersPagination(LimitOffsetPagination):
    default_limit = services.GROUP_MEMBERS_LIST_LIMIT


class _NotificationPagination(LimitOffsetPagination):
    default_limit = services.NOTIFICATION_LIST_LIMIT


def _assert_member(group_id, user_id):
    # Intentionally 404, not 403: non-members shouldn't be able to distinguish
    # "group doesn't exist" from "group exists but you're not in it".
    return get_object_or_404(models.GroupMember, group_id=group_id, user_id=user_id)


def _activity_out(activity, current_user_id):
    return serializers.ActivityOutSerializer(activity, context={"current_user_id": current_user_id}).data


def _fetch_activity(activity_id, user, group_id=None):
    """Fetch `activity_id`, requiring `user` to be a member of its group.
    If `group_id` is given, also require the activity belongs to that group.
    Returns an (activity, error) tuple: on success `error` is None, on
    failure `activity` is None and `error` is a Response to return as-is.
    """
    activity = get_object_or_404(models.Activity, pk=activity_id)
    _assert_member(activity.group_id, user.id)
    if group_id is not None and activity.group_id != group_id:
        return None, Response({"detail": "Activity not found in this group"}, status=status.HTTP_404_NOT_FOUND)
    return activity, None


def _get_owned_activity(activity_id, user):
    """Fetch `activity_id`, requiring `user` to be a group member and the
    activity's creator. Returns an (activity, error) tuple: on success
    `error` is None, on failure `activity` is None and `error` is a
    Response to return as-is.
    """
    activity, error = _fetch_activity(activity_id, user)
    if error is not None:
        return None, error
    if activity.submitted_by_id != user.id:
        return None, Response({"detail": "Only the creator can modify this activity"}, status=status.HTTP_403_FORBIDDEN)
    return activity, None


# ---- Auth ----


def _join_via_invite_code(user, invite_code):
    """Add `user` to the group for `invite_code`, if it resolves to a group.

    Used to complete the invite-link flow: a fresh visitor lands on an invite
    link, registers or logs in (carrying the invite code along), and is
    dropped straight into the group without a separate join step.
    """
    if not invite_code:
        return
    group = models.Group.objects.filter(invite_code=invite_code).first()
    if group is not None:
        _join_group(user, group)


def _join_group(user, group):
    models.GroupMember.objects.get_or_create(user=user, group=group)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [_AuthRateThrottle]

    def post(self, request):
        serializer = serializers.RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=data["email"],
                    email=data["email"],
                    password=data["password"],
                    first_name=data["name"],
                )
                models.Profile.objects.create(user=user, phone_number=data.get("phone_number"))
                _join_via_invite_code(user, data.get("invite_code"))
        except IntegrityError:
            return Response({"email": ["Email already registered"]}, status=status.HTTP_400_BAD_REQUEST)
        login(request, user)
        return Response(status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [_AuthRateThrottle]

    def post(self, request):
        serializer = serializers.LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            username = User.objects.get(email__iexact=data["email"]).username
        except User.DoesNotExist:
            username = data["email"]
        user = authenticate(request, username=username, password=data["password"])
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        _join_via_invite_code(user, data.get("invite_code"))
        login(request, user)
        return Response(status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """Email a signed, expiring reset link for the requested address.

    Returns 204 regardless of whether the email matches an account, so this
    endpoint can't be used to enumerate registered users. If the address
    does match but the send itself fails (e.g. mail transport is down),
    returns 502 with a user-facing error instead of a silent 204 - this
    reveals mail-service health but not which addresses are registered.
    """

    authentication_classes = []
    permission_classes = []
    throttle_classes = [_AuthRateThrottle]

    def post(self, request):
        serializer = serializers.PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{request.scheme}://{request.get_host()}/movie_night/reset-password?uid={uid}&token={token}"
            try:
                send_mail(
                    subject="Reset your Movie Night password",
                    message=f"Click the link below to reset your password:\n\n{reset_link}\n\n"
                    "If you didn't request this, you can ignore this email.",
                    from_email=None,
                    recipient_list=[user.email],
                )
            except (smtplib.SMTPException, BadHeaderError, OSError, ClientError):
                return Response(
                    {"detail": "We couldn't send the reset email. Please try again in a few minutes."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [_AuthRateThrottle]

    def post(self, request):
        serializer = serializers.PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid or expired reset link"}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, data["token"]):
            return Response({"detail": "Invalid or expired reset link"}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(data["password"])
        user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutView(MovieNightAPIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(MovieNightAPIView):
    def get(self, request):
        return Response(serializers.UserOutSerializer(request.user).data)


# ---- Groups ----


class GroupListCreateView(MovieNightAPIView):
    def post(self, request):
        serializer = serializers.GroupCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = models.Group.objects.create(name=serializer.validated_data["name"], created_by=request.user)
        models.GroupMember.objects.create(user=request.user, group=group, role=models.GroupRole.OWNER)
        return Response(serializers.GroupOutSerializer(group).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        groups = models.Group.objects.filter(members__user=request.user)
        return Response(serializers.GroupOutSerializer(groups, many=True).data)


class GroupDetailView(MovieNightAPIView):
    def get(self, request, group_id):
        membership = _assert_member(group_id, request.user.id)
        return Response(serializers.GroupOutSerializer(membership.group).data)


class GroupInvitePreviewView(APIView):
    """Unauthenticated lookup so an invite link can show "You've been invited
    to <group name>" before the visitor logs in or registers.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request, invite_code):
        group = get_object_or_404(models.Group, invite_code=invite_code)
        return Response(serializers.GroupInvitePreviewSerializer(group).data)


class GroupJoinView(MovieNightAPIView):
    def post(self, request):
        serializer = serializers.GroupJoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = get_object_or_404(models.Group, invite_code=serializer.validated_data["invite_code"])
        _join_group(request.user, group)
        return Response(serializers.GroupOutSerializer(group).data)


class GroupMembersView(MovieNightAPIView):
    def get(self, request, group_id):
        _assert_member(group_id, request.user.id)
        members = models.GroupMember.objects.filter(group_id=group_id).select_related("user")
        paginator = _MembersPagination()
        page = paginator.paginate_queryset(members, request, view=self)
        return paginator.get_paginated_response(serializers.MemberOutSerializer(page, many=True).data)


# ---- Activities ----


class ActivityListCreateView(MovieNightAPIView):
    def post(self, request, group_id):
        _assert_member(group_id, request.user.id)
        serializer = serializers.ActivityCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity = models.Activity.objects.create(
            group_id=group_id, submitted_by=request.user, **serializer.validated_data
        )
        services.notify_group(
            group_id=group_id,
            message=f'{_display_name(request.user)} added "{activity.title}" to the watchlist.',
            exclude_user_id=request.user.id,
        )
        return Response(_activity_out(activity, request.user.id), status=status.HTTP_201_CREATED)

    def get(self, request, group_id):
        _assert_member(group_id, request.user.id)
        activities = (
            models.Activity.objects.filter(group_id=group_id)
            .select_related("submitted_by")
            .prefetch_related(Prefetch("interests", queryset=models.ActivityInterest.objects.select_related("user")))
        )
        paginator = _ActivityPagination()
        page = paginator.paginate_queryset(activities, request, view=self)
        return paginator.get_paginated_response([_activity_out(a, request.user.id) for a in page])


class ActivityDetailView(MovieNightAPIView):
    def patch(self, request, activity_id):
        activity, error = _get_owned_activity(activity_id, request.user)
        if error is not None:
            return error
        serializer = serializers.ActivityCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(activity, field, value)
        activity.save()
        return Response(_activity_out(activity, request.user.id))

    def delete(self, request, activity_id):
        activity, error = _get_owned_activity(activity_id, request.user)
        if error is not None:
            return error
        activity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityInterestView(MovieNightAPIView):
    def post(self, request, activity_id):
        activity, error = _fetch_activity(activity_id, request.user)
        if error is not None:
            return error
        serializer = serializers.InterestUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        models.ActivityInterest.objects.update_or_create(
            user=request.user,
            activity=activity,
            defaults={"level": serializer.validated_data["level"]},
        )
        return Response(_activity_out(activity, request.user.id))


# ---- Availability ----


class AvailabilitySubmitView(MovieNightAPIView):
    def post(self, request, group_id):
        _assert_member(group_id, request.user.id)
        serializer = serializers.SlotSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        models.AvailabilitySlot.objects.filter(user=request.user, group_id=group_id).delete()

        cutoff = django_timezone.now() + services.AVAILABILITY_SUBMIT_WINDOW
        new_slots = []
        for slot in serializer.validated_data["slots"]:
            if slot["end_time"] <= slot["start_time"]:
                continue
            if slot["start_time"] > cutoff:
                continue
            new_slots.append(
                models.AvailabilitySlot(
                    user=request.user,
                    group_id=group_id,
                    start_time=slot["start_time"],
                    end_time=slot["end_time"],
                )
            )
        models.AvailabilitySlot.objects.bulk_create(new_slots)

        services.notify_group(
            group_id=group_id,
            message=f"{_display_name(request.user)} updated their availability.",
            exclude_user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyAvailabilityView(MovieNightAPIView):
    def get(self, request, group_id):
        _assert_member(group_id, request.user.id)
        slots = models.AvailabilitySlot.objects.filter(user=request.user, group_id=group_id)
        return Response(serializers.UserSlotsSerializer(request.user, context={"slots": slots}).data)


class CollatedAvailabilityView(MovieNightAPIView):
    def get(self, request, group_id, activity_id):
        _assert_member(group_id, request.user.id)
        result = services.collate_availability(group_id, activity_id)
        return Response(serializers.CollatedSlotSerializer(result, many=True).data)


class SuggestDateView(MovieNightAPIView):
    def post(self, request, group_id):
        _assert_member(group_id, request.user.id)
        serializer = serializers.SuggestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        activity, error = _fetch_activity(data["activity_id"], request.user, group_id=group_id)
        if error is not None:
            return error

        msg = services.format_suggestion_message(
            _display_name(request.user), activity.title, data["start_time"], data.get("message")
        )
        services.notify_group(group_id=group_id, message=msg, exclude_user_id=request.user.id)
        return Response({"detail": "Suggestion sent"}, status=status.HTTP_201_CREATED)


# ---- Notifications ----


class NotificationListView(MovieNightAPIView):
    def get(self, request):
        notifications = models.Notification.objects.filter(user=request.user)
        paginator = _NotificationPagination()
        page = paginator.paginate_queryset(notifications, request, view=self)
        return paginator.get_paginated_response(serializers.NotificationOutSerializer(page, many=True).data)


class NotificationMarkReadView(MovieNightAPIView):
    def patch(self, request, notif_id):
        notif = get_object_or_404(models.Notification, pk=notif_id, user=request.user)
        notif.read = True
        notif.save(update_fields=["read"])
        return Response(serializers.NotificationOutSerializer(notif).data)


class NotificationMarkAllReadView(MovieNightAPIView):
    def patch(self, request):
        models.Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)
