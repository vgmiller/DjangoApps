from rest_framework import serializers
from .models import *

class PerfumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfume
        fields = ['id' ,'name', 'myDescription', 'rating', 'tags']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
