"""portfolio URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import settings, views
from django.contrib.staticfiles.urls import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = [
    path('', views.index, name='index'),
    path('admin/', admin.site.urls),
    path('projectGallery/', include('projectGallery.urls')),
    path('blog/', include('blog.urls')),
    path('naga/', include('naga.urls')),
    path('music/', include('music.urls')),
    path('mediaServer/', include('mediaServer.urls')),
	path('accounts/', include('django.contrib.auth.urls')),
    path('todo/', include('todo.urls')),
    path('perfume/', include('perfume.urls')),
    path('hobbits/', include('hobbits.urls')),
]

urlpatterns += staticfiles_urlpatterns()
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
