from django.contrib import admin

from perfume.models import Perfume, Tag


class TagAdmin(admin.ModelAdmin):
    list_display = ("name",)


admin.site.register(Tag, TagAdmin)


class PerfumeAdmin(admin.ModelAdmin):
    list_display = ("name", "myDescription", "rating", "isEmpty")


admin.site.register(Perfume, PerfumeAdmin)
