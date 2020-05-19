from django.urls import path
from . import views
from naga.views import NodeUpdateView

urlpatterns = [
    path("", views.naga_index, name="naga_index"),
    path("<str:name>/", views.naga_characterHome, name="naga_characterHome"),
    path("<int:pk>/", NodeUpdateView.as_view(), name="naga_node_edit_form"),
]
