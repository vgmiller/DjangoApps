from django.urls import path

from . import views

urlpatterns = [
    # API routes, scoped under "api/" so the SPA catch-all below (which
    # serves every other /movie_night/... path) can never shadow them.
    # These must come before the catch-all since Django resolves top-to-bottom.
    path("api/auth/register", views.RegisterView.as_view(), name="movie_night_register"),
    path("api/auth/login", views.LoginView.as_view(), name="movie_night_login"),
    path("api/auth/logout", views.LogoutView.as_view(), name="movie_night_logout"),
    path("api/auth/me", views.MeView.as_view(), name="movie_night_me"),
    path("api/groups", views.GroupListCreateView.as_view(), name="movie_night_groups"),
    path("api/groups/join", views.GroupJoinView.as_view(), name="movie_night_group_join"),
    path(
        "api/groups/invite/<str:invite_code>",
        views.GroupInvitePreviewView.as_view(),
        name="movie_night_group_invite_preview",
    ),
    path("api/groups/<int:group_id>", views.GroupDetailView.as_view(), name="movie_night_group_detail"),
    path("api/groups/<int:group_id>/members", views.GroupMembersView.as_view(), name="movie_night_group_members"),
    path(
        "api/groups/<int:group_id>/activities",
        views.ActivityListCreateView.as_view(),
        name="movie_night_activities",
    ),
    path(
        "api/activities/<int:activity_id>",
        views.ActivityDetailView.as_view(),
        name="movie_night_activity_detail",
    ),
    path(
        "api/activities/<int:activity_id>/interest",
        views.ActivityInterestView.as_view(),
        name="movie_night_activity_interest",
    ),
    path(
        "api/groups/<int:group_id>/availability",
        views.AvailabilitySubmitView.as_view(),
        name="movie_night_availability_submit",
    ),
    path(
        "api/groups/<int:group_id>/availability/me",
        views.MyAvailabilityView.as_view(),
        name="movie_night_availability_me",
    ),
    path(
        "api/groups/<int:group_id>/availability/<int:activity_id>",
        views.CollatedAvailabilityView.as_view(),
        name="movie_night_availability_collated",
    ),
    path("api/groups/<int:group_id>/suggest", views.SuggestDateView.as_view(), name="movie_night_suggest"),
    path("api/notifications", views.NotificationListView.as_view(), name="movie_night_notifications"),
    path(
        "api/notifications/<int:notif_id>/read",
        views.NotificationMarkReadView.as_view(),
        name="movie_night_notification_read",
    ),
    path(
        "api/notifications/read-all",
        views.NotificationMarkAllReadView.as_view(),
        name="movie_night_notifications_read_all",
    ),
    # Built React SPA, served directly at the root of /movie_night/. React
    # Router (basename="/movie_night") handles client-side routing from
    # here; this view just needs to return the same index.html for every
    # sub-path (e.g. /movie_night/groups/1). Must stay last so it never
    # shadows the api/... routes above.
    path("", views.app, name="movie_night_app"),
    path("<path:path>", views.app, name="movie_night_app_subpath"),
]
