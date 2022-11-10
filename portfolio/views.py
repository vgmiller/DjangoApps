from django.shortcuts import render
from django.conf import settings

def index(request):
	context = {
		"breakpoints": settings.IMAGE_BREAKPOINTS,
		"nagaImageUrl": "naga/naga_sil.png",
		"musicImageUrl": "music/VMiller_Picc.jpg",
		"hobbitsImageUrl": "hobbits/onering.jpg",
	}
	return render(request, "index.html", context)

