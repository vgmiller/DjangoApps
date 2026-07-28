from django.contrib import admin

from movie_night.models import (
    Activity,
    ActivityInterest,
    AvailabilitySlot,
    Group,
    GroupMember,
    Notification,
    Profile,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number")


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "invite_code", "created_by", "created_at")


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ("group", "user", "role", "joined_at")


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "group", "submitted_by", "type", "created_at")


@admin.register(ActivityInterest)
class ActivityInterestAdmin(admin.ModelAdmin):
    list_display = ("activity", "user", "level", "updated_at")


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ("user", "group", "start_time", "end_time")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "group", "read", "created_at")
