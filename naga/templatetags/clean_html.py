from django import template
from django.utils.safestring import mark_safe
import nh3
import re

register = template.Library()

ALLOWED_TAGS = {'a', 'b', 'i', 'u', 'em', 'strong', 'br', 'p'}
ALLOWED_ATTRIBUTES = {'a': {'href', 'title', 'target'}}


@register.filter
def clean_html(value):
    if not value:
        return value
    cleaned = nh3.clean(str(value), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES)
    cleaned = re.sub(r'(?i)\bhref="(?:javascript|data|vbscript):[^"]*"', 'href="#"', cleaned)
    return mark_safe(cleaned)
