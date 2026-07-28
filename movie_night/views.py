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
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import transaction
from django.shortcuts import get_object_or_404, render
from django.utils import timezone as django_timezone
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import models, serializers, services
from .services import display_name as _display_name

User = get_user_model()


def app(request, path=None):
    """Serve the built React SPA for any /movie_night/... route that isn't
    under /movie_night/api/.

    React Router (basename="/movie_night") handles client-side routing
    from there; this view just needs to return the same index.html for
    every sub-path (e.g. /movie_night/groups/1).
    """
    return render(request, "movie_night_app.html")


class MovieNightAPIView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]


def _assert_member(group_id, user_id):
    return get_object_or_404(models.GroupMember, group_id=group_id, user_id=user_id)


def _activity_out(activity, current_user_id):
    interests = list(activity.interests.select_related("user"))
    my_interest = next((i.level for i in interests if i.user_id == current_user_id), None)
    return {
        "id": activity.id,
        "group_id": activity.group_id,
        "submitted_by": activity.submitted_by_id,
        "submitted_by_name": _display_name(activity.submitted_by),
        "title": activity.title,
        "type": activity.type,
        "imdb_url": activity.imdb_url,
        "description": activity.description,
        "created_at": activity.created_at,
        "my_interest": my_interest,
        "interests": [
            {
                "user_id": i.user_id,
                "user_name": _display_name(i.user),
                "level": i.level,
                "updated_at": i.updated_at,
            }
            for i in interests
        ],
    }


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

    def post(self, request):
        serializer = serializers.RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            user = User.objects.create_user(
                username=data["email"],
                email=data["email"],
                password=data["password"],
                first_name=data["name"],
            )
            models.Profile.objects.create(user=user, phone_number=data.get("phone_number"))
            _join_via_invite_code(user, data.get("invite_code"))
        login(request, user)
        return Response(status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

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
        data = [
            {
                "user_id": m.user_id,
                "name": _display_name(m.user),
                "email": m.user.email,
                "role": m.role,
                "joined_at": m.joined_at,
            }
            for m in members
        ]
        return Response(serializers.MemberOutSerializer(data, many=True).data)


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
        activities = models.Activity.objects.filter(group_id=group_id).select_related("submitted_by")
        return Response([_activity_out(a, request.user.id) for a in activities])


class ActivityDetailView(MovieNightAPIView):
    def patch(self, request, activity_id):
        activity = get_object_or_404(models.Activity, pk=activity_id)
        _assert_member(activity.group_id, request.user.id)
        if activity.submitted_by_id != request.user.id:
            return Response({"detail": "Only the creator can edit this activity"}, status=status.HTTP_403_FORBIDDEN)
        serializer = serializers.ActivityCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(activity, field, value)
        activity.save()
        return Response(_activity_out(activity, request.user.id))

    def delete(self, request, activity_id):
        activity = get_object_or_404(models.Activity, pk=activity_id)
        _assert_member(activity.group_id, request.user.id)
        if activity.submitted_by_id != request.user.id:
            return Response({"detail": "Only the creator can delete this activity"}, status=status.HTTP_403_FORBIDDEN)
        activity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityInterestView(MovieNightAPIView):
    def post(self, request, activity_id):
        activity = get_object_or_404(models.Activity, pk=activity_id)
        _assert_member(activity.group_id, request.user.id)
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
        data = {
            "user_id": request.user.id,
            "user_name": _display_name(request.user),
            "slots": [{"start_time": s.start_time, "end_time": s.end_time} for s in slots],
        }
        return Response(serializers.UserSlotsSerializer(data).data)


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
        activity = get_object_or_404(models.Activity, pk=data["activity_id"])
        if activity.group_id != group_id:
            return Response({"detail": "Activity not found in this group"}, status=status.HTTP_404_NOT_FOUND)

        msg = services.format_suggestion_message(
            _display_name(request.user), activity.title, data["start_time"], data.get("message")
        )
        services.notify_group(group_id=group_id, message=msg, exclude_user_id=request.user.id)
        return Response({"detail": "Suggestion sent"}, status=status.HTTP_201_CREATED)


# ---- Notifications ----


class NotificationListView(MovieNightAPIView):
    def get(self, request):
        notifications = models.Notification.objects.filter(user=request.user)[: services.NOTIFICATION_LIST_LIMIT]
        return Response(serializers.NotificationOutSerializer(notifications, many=True).data)


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
