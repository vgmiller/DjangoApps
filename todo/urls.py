from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework import routers

from todo import views

router = routers.DefaultRouter()
router.register(r"todos", views.TodoView, "todo")

urlpatterns = [path("", views.index), path("api/", include(router.urls))] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT
)
