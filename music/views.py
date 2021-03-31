from django.shortcuts import render
from music.models import Piece, Program
from django.core.mail import send_mail, BadHeaderError
from django.http import HttpResponse, HttpResponseRedirect
from music.forms import ContactForm
from django.contrib import messages

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
	if request.method == 'GET':
		form = ContactForm()
	else:
		form = ContactForm(request.POST)
		if form.is_valid():
			subject = form.cleaned_data['subject']
			from_email = form.cleaned_data['from_email']
			message = form.cleaned_data['message']
			tagline = " - Sent from %s" % from_email
			message+=tagline
			try:
				myEmail = 'vanessa.g.miller@gmail.com'
				send_mail(subject, message, myEmail, [myEmail])
			except BadHeaderError:
				return HttpResponse('Invalid header found.')
			messages.success(request, 'Your message was sent!')
	return render(request, "music_contact.html", {'form': form})
