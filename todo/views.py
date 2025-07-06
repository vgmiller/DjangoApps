from django.shortcuts import render
from rest_framework import viewsets

from .models import Todo
from .serializers import TodoSerializer


def index(request):
    return render(request, "todo_index.html")


class TodoView(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    queryset = Todo.objects.all()
