"""portfolio URL Configuration"""

from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path

from . import settings, views
from .sitemaps import StaticViewSitemap

sitemaps = {
    "static": StaticViewSitemap,
}

urlpatterns = [
    path("", views.index, name="index"),
    path("admin/", admin.site.urls),
    path("projectGallery/", include("projectGallery.urls")),
    path("blog/", include("blog.urls")),
    path("naga/", include("naga.urls")),
    path("mediaServer/", include("mediaServer.urls")),
    path("accounts/", include("django.contrib.auth.urls")),
    path("perfume/", include("perfume.urls")),
    path("hobbits/", include("hobbits.urls")),
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="django.contrib.sitemaps.views.sitemap"),
]

urlpatterns += staticfiles_urlpatterns()
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
