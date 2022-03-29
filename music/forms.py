from django import forms
from django.forms import TextInput, EmailInput
from django.core.exceptions import ValidationError

class HoneypotField(forms.BooleanField):
    default_widget = forms.CheckboxInput({'style': 'display:none !important;', 'tabindex': '-1', 'autocomplete': 'off'})
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('widget', HoneypotField.default_widget)
        kwargs['required'] = False
        super().__init__(*args, **kwargs)
    def clean(self, value):
        if super().clean(value):
            raise ValidationError('')
        else:
            return None

class ContactForm(forms.Form):
	name = forms.CharField(label="", widget=forms.TextInput(attrs={'class': 'formField', 'placeholder': 'Name'}), required=True)
	from_email = forms.EmailField(label="", widget=forms.EmailInput(attrs={'class': 'formField', 'placeholder': 'Email'}), required=True)
	subject = forms.CharField(label="", widget=forms.TextInput(attrs={'class': 'formField', 'placeholder': 'Subject'}), required=True)
	message = forms.CharField(label="", widget=forms.Textarea(attrs={'class': 'formField', 'placeholder': 'Message'}), required=True)
	inviteCode  = HoneypotField(label="")

