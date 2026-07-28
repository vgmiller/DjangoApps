from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from . import models

User = get_user_model()


def _display_name(user):
    return user.get_full_name() or user.get_username()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField()
    phone_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    invite_code = serializers.CharField(required=False, allow_null=True, allow_blank=True)

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
    invite_code = serializers.CharField(required=False, allow_null=True, allow_blank=True)


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
    name = serializers.CharField()


class GroupOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Group
        fields = ["id", "name", "invite_code", "created_by", "created_at"]


class GroupJoinSerializer(serializers.Serializer):
    invite_code = serializers.CharField()


class GroupInvitePreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Group
        fields = ["id", "name"]


class MemberOutSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    joined_at = serializers.DateTimeField()


class ActivityCreateSerializer(serializers.Serializer):
    title = serializers.CharField()
    type = serializers.ChoiceField(choices=models.ActivityType.choices, default=models.ActivityType.MOVIE)
    imdb_url = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class InterestOutSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    user_name = serializers.CharField()
    level = serializers.CharField()
    updated_at = serializers.DateTimeField()


class ActivityOutSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    group_id = serializers.IntegerField()
    submitted_by = serializers.IntegerField()
    submitted_by_name = serializers.CharField()
    title = serializers.CharField()
    type = serializers.CharField()
    imdb_url = serializers.CharField(allow_null=True)
    description = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()
    interests = InterestOutSerializer(many=True)
    my_interest = serializers.CharField(allow_null=True)


class InterestUpsertSerializer(serializers.Serializer):
    level = serializers.ChoiceField(choices=models.InterestLevel.choices)


class SlotRangeSerializer(serializers.Serializer):
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()


class SlotSubmitSerializer(serializers.Serializer):
    slots = SlotRangeSerializer(many=True)


class UserSlotsSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    user_name = serializers.CharField()
    slots = SlotRangeSerializer(many=True)


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
    end_time = serializers.DateTimeField()
    message = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class NotificationOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Notification
        fields = ["id", "group_id", "message", "read", "created_at"]
