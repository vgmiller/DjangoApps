from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Perfume(models.Model):
    name = models.CharField(max_length=100)
    myDescription = models.TextField(blank=True, null=True)
    theirDescription = models.TextField(blank=True, null=True)
    rating = models.DecimalField(blank=True, null=True, max_digits=10, decimal_places=5)
    isEmpty = models.BooleanField(default=False)
    tags = models.ManyToManyField(Tag)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
