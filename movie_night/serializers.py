from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from . import models
from .services import display_name as _display_name

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    # Stored as User.username (max_length=150) as well as email, so cap to match.
    email = serializers.EmailField(max_length=150)
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=32, required=False, allow_null=True, allow_blank=True)
    invite_code = serializers.CharField(max_length=8, required=False, allow_null=True, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    invite_code = serializers.CharField(max_length=8, required=False, allow_null=True, allow_blank=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value)
        return value


class UserOutSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source="date_joined")

    class Meta:
        model = User
        fields = ["id", "email", "name", "phone_number", "created_at"]

    def get_name(self, obj):
        return _display_name(obj)

    def get_phone_number(self, obj):
        profile = getattr(obj, "movie_night_profile", None)
        return profile.phone_number if profile else None


class GroupCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)


class GroupOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Group
        fields = ["id", "name", "invite_code", "created_by", "created_at"]


class GroupJoinSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=8)


class GroupInvitePreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Group
        fields = ["id", "name"]


class MemberOutSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField()
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")

    class Meta:
        model = models.GroupMember
        fields = ["user_id", "name", "email", "role", "joined_at"]

    def get_name(self, obj):
        return _display_name(obj.user)


class ActivityCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    type = serializers.ChoiceField(choices=models.ActivityType.choices, default=models.ActivityType.MOVIE)
    imdb_url = serializers.URLField(max_length=512, required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class InterestUpsertSerializer(serializers.Serializer):
    level = serializers.ChoiceField(choices=models.InterestLevel.choices)


class SlotRangeSerializer(serializers.Serializer):
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()


class SlotSubmitSerializer(serializers.Serializer):
    slots = SlotRangeSerializer(many=True)


class UserSlotsSerializer(serializers.Serializer):
    # context["slots"] must be provided by the caller (queryset of AvailabilitySlot for `obj`)
    user_id = serializers.IntegerField(source="id")
    user_name = serializers.SerializerMethodField()
    slots = serializers.SerializerMethodField()

    def get_user_name(self, obj):
        return _display_name(obj)

    def get_slots(self, obj):
        return SlotRangeSerializer(self.context["slots"], many=True).data


class ActivityInterestOutSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = models.ActivityInterest
        fields = ["user_id", "user_name", "level", "updated_at"]

    def get_user_name(self, obj):
        return _display_name(obj.user)


class ActivityOutSerializer(serializers.ModelSerializer):
    # context["current_user_id"] must be provided by the caller
    submitted_by_name = serializers.SerializerMethodField()
    my_interest = serializers.SerializerMethodField()
    interests = serializers.SerializerMethodField()

    class Meta:
        model = models.Activity
        fields = [
            "id",
            "group_id",
            "submitted_by",
            "submitted_by_name",
            "title",
            "type",
            "imdb_url",
            "description",
            "created_at",
            "my_interest",
            "interests",
        ]

    def get_submitted_by_name(self, obj):
        return _display_name(obj.submitted_by)

    def _interests(self, obj):
        # obj.interests.all() reuses the caller's prefetch_related cache when
        # present (see ActivityListCreateView.get); this dict just avoids
        # hitting that (or issuing a fresh query) twice per activity, since
        # both get_my_interest and get_interests call in.
        # Note: relies on the caller prefetching with select_related("user")
        # (ActivityListCreateView.get does). A new caller of this serializer
        # that skips that select_related will hit an N+1 on interest.user.
        cache = self.context.setdefault("_interests_cache", {})
        if obj.id not in cache:
            cache[obj.id] = list(obj.interests.all())
        return cache[obj.id]

    def get_my_interest(self, obj):
        current_user_id = self.context.get("current_user_id")
        return next((i.level for i in self._interests(obj) if i.user_id == current_user_id), None)

    def get_interests(self, obj):
        return ActivityInterestOutSerializer(self._interests(obj), many=True).data


class CollatedSlotSerializer(serializers.Serializer):
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    definitely_interested_count = serializers.IntegerField()
    sure_why_not_count = serializers.IntegerField()
    definitely_interested_users = serializers.ListField(child=serializers.CharField())
    sure_why_not_users = serializers.ListField(child=serializers.CharField())


class SuggestionCreateSerializer(serializers.Serializer):
    activity_id = serializers.IntegerField()
    start_time = serializers.DateTimeField()
    message = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class NotificationOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Notification
        fields = ["id", "group_id", "message", "read", "created_at"]
