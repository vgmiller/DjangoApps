from django.contrib import admin
from django.conf import settings
from django.urls import path,include               
from rest_framework import routers                 
from todo import views                             
from django.contrib.staticfiles.urls import static

router = routers.DefaultRouter()                   
router.register(r'todos', views.TodoView, 'todo')  

urlpatterns = [
    path('', views.index),
	path('api/', include(router.urls))             
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
