from django.urls import path, include
from . import views
from naga.views import NodeUpdateView

urlpatterns = [
    path("", views.naga_index, name="naga_index"),
    path("<str:name>/", views.naga_characterHome, name="naga_characterHome"),
    path("api/publicCharacterSummary/", views.naga_publicCharacterSummary, name="naga_publicCharacterSummary"),
    path("<int:pk>/", NodeUpdateView.as_view(), name="naga_node_edit_form"),
    path('accounts/', include('django.contrib.auth.urls')),
    path('accounts/signup/', views.signup, name='signup'),
    path('accounts/profile/', views.myProfile, name='myProfile'),
]
