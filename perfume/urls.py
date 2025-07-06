from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework import routers

from perfume import views

router = routers.DefaultRouter()
router.register(r"perfumes", views.PerfumeView, "perfume")
router.register(r"tags", views.TagView, "tag")

urlpatterns = [path("", views.index), path("api/", include(router.urls))] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT
)
