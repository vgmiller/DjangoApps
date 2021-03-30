from django import template
register = template.Library()

@register.filter
def order_by(queryset, orderByName):
    return queryset.order_by(orderByName)
