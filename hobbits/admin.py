from django.contrib import admin

from hobbits.models import Event, MajorMilestone, Walk


class WalkAdmin(admin.ModelAdmin):
    list_display = ("fitbitLogId", "startDateTime", "distance")


admin.site.register(Walk, WalkAdmin)


class MajorMilestoneAdmin(admin.ModelAdmin):
    list_display = ("position", "text", "distanceFromShire", "distanceFromLastMilestone")


admin.site.register(MajorMilestone, MajorMilestoneAdmin)


class EventAdmin(admin.ModelAdmin):
    list_display = ("text", "distanceFromShire", "distanceFromLastEvent")


admin.site.register(Event, EventAdmin)
