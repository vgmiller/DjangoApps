from django.db import models

class Project(models.Model):
    title = models.CharField(max_length=100)
    summary = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    technology = models.CharField(max_length=20, blank=True, null=True)
    image = models.ImageField(upload_to='projectGallery/uploads/', blank=True, null=True)
    url = models.CharField(max_length=100, blank=True, null=True)
