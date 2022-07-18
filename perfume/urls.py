from django.contrib import admin
from django.conf import settings
from django.urls import path,include               
from rest_framework import routers                 
from perfume import views                             
from django.contrib.staticfiles.urls import static

router = routers.DefaultRouter()                   
router.register(r'perfumes', views.PerfumeView, 'perfume')  
router.register(r'tags', views.TagView, 'tag')  

urlpatterns = [
    path('', views.index),
	path('api/', include(router.urls))             
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
