from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.movie_index, name="movie_index"),
    path("accounts/", include("django.contrib.auth.urls")),
    path("movie_index", views.movie_index, name="movie_index"),
    path("watch_movie/<str:movie>/", views.watch_movie, name="watch_movie"),
]
