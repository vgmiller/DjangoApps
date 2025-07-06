from django import template

register = template.Library()


@register.filter
def slotsUsed(character, i):
    attrName = "lvl%sslotsUsed" % i
    return getattr(character, attrName)
