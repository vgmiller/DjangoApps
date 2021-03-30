from django.shortcuts import render
from music.models import Piece, Program

def music_index(request):
    context = {
    }
    return render(request, "music_index.html", context)

def music_about(request):
    context = { }
    return render(request, "music_about.html", context)

def music_recordings(request):
    context = {
    }
    return render(request, "music_recordings.html", context)

def music_repertoire(request):
    repertoire = {}
    repertoire["Concertos"] = Piece.objects.filter(category=1).order_by('composer__lastName')
    repertoire["Solos with Orchestra"] = Piece.objects.filter(category=2).order_by('composer__lastName')
    repertoire["Unaccompanied"] = Piece.objects.filter(category=4).order_by('composer__lastName')
    repertoire["Solos with Piano"] = Piece.objects.filter(category=3).order_by('composer__lastName')
    context = {
        "repertoire": repertoire
    }
    return render(request, "music_repertoire.html", context)

def music_samplePrograms(request):
    context = {
	"programs": Program.objects.order_by("pageOrder"),
    }
    return render(request, "music_samplePrograms.html", context)

def music_news(request):
    context = {
    }
    return render(request, "music_news.html", context)

def music_contact(request):
    context = {
    }
    return render(request, "music_contact.html", context)
