from django.contrib import admin
from projectGallery.models import Project

class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'summary')    

admin.site.register(Project, ProjectAdmin)
