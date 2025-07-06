from django.urls import path

from . import views

urlpatterns = [
    path("", views.project_index, name="project_index"),
    path("project_acknowledgements", views.project_acknowledgements, name="project_acknowledgements"),
    path("<int:pk>/", views.project_detail, name="project_detail"),
]
