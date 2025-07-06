from django.urls import path

from . import views

urlpatterns = [
    path("", views.hobbits_index, name="hobbits_index"),
    path("log", views.hobbits_log, name="hobbits_log"),
    path("refreshData", views.hobbits_refreshData, name="hobbits_refreshData"),
    path("reauthFitbit", views.reauthFitbit, name="reauthFitbit"),
    # path("legacyDataImport", views.legacyDataImport, name="legacyDataImport"),
]
