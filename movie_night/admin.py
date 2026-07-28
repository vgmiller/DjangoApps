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


class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number")


admin.site.register(Profile, ProfileAdmin)


class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "invite_code", "created_by", "created_at")


admin.site.register(Group, GroupAdmin)


class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ("group", "user", "role", "joined_at")


admin.site.register(GroupMember, GroupMemberAdmin)


class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "group", "submitted_by", "type", "created_at")


admin.site.register(Activity, ActivityAdmin)


class ActivityInterestAdmin(admin.ModelAdmin):
    list_display = ("activity", "user", "level", "updated_at")


admin.site.register(ActivityInterest, ActivityInterestAdmin)


class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ("user", "group", "start_time", "end_time")


admin.site.register(AvailabilitySlot, AvailabilitySlotAdmin)


class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "group", "read", "created_at")


admin.site.register(Notification, NotificationAdmin)
