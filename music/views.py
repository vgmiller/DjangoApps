from django.shortcuts import render

def music_index(request):
    context = {
    }
    return render(request, "music_index.html", context)

