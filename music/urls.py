from django.urls import path
from . import views

urlpatterns = [
    path("", views.music_index, name="music_index"),
    path("about", views.music_about, name="music_about"),
    path("recordings", views.music_recordings, name="music_recordings"),
    path("repertoire", views.music_repertoire, name="music_repertoire"),
    path("samplePrograms", views.music_samplePrograms, name="music_samplePrograms"),
    path("news", views.music_news, name="music_news"),
    path("contact", views.music_contact, name="music_contact"),
]
