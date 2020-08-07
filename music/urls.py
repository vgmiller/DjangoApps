from django.urls import path
from . import views

urlpatterns = [
    path("", views.music_index, name="music_index"),
]
