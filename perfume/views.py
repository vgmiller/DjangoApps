from django.shortcuts import render
from rest_framework import viewsets

from .models import Perfume, Tag
from .serializers import PerfumeSerializer, TagSerializer


def index(request):
    return render(request, "perfume_index.html")


class PerfumeView(viewsets.ModelViewSet):
    serializer_class = PerfumeSerializer
    queryset = Perfume.objects.filter(isEmpty=False)


class TagView(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.all()
