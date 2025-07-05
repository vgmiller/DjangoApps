from django.shortcuts import render
from projectGallery.models import Project
from django.conf import settings

def project_index(request):
    projects = Project.objects.all()
    context = {
        "breakpoints": settings.IMAGE_BREAKPOINTS,
        'projects': projects
    }
    return render(request, 'project_index.html', context)

def project_acknowledgements(request):
    return render(request, 'project_acknowledgements.html', {})

def project_detail(request, pk):
    project = Project.objects.get(pk=pk)
    context = {
        "breakpoints": settings.IMAGE_BREAKPOINTS,
        'project': project
    }
    return render(request, 'project_detail.html', context)
