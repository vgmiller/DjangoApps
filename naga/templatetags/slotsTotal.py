from django import template

register = template.Library()


@register.filter
def slotsTotal(character, i):
    attrName = "lvl%sslotsTotal" % i
    return getattr(character, attrName)
