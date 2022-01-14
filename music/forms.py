from django import forms
from django.forms import TextInput, EmailInput

class ContactForm(forms.Form):
    name = forms.CharField(label="", widget=forms.TextInput(attrs={'class': 'formField', 'placeholder': 'Name'}), required=True)
    from_email = forms.EmailField(label="", widget=forms.EmailInput(attrs={'class': 'formField', 'placeholder': 'Email'}), required=True)
    subject = forms.CharField(label="", widget=forms.TextInput(attrs={'class': 'formField', 'placeholder': 'Subject'}), required=True)
    message = forms.CharField(label="", widget=forms.Textarea(attrs={'class': 'formField', 'placeholder': 'Message'}), required=True)
