from django.db import models

class Piece(models.Model):
    CATEGORY_CHOICES = (
            ('1', 'Concerto'),
            ('2', 'Solo with Orchestra'),
            ('3', 'Solo with Piano'),
            ('4', 'Unaccompanied'),
        )
    INSTRUMENT_CHOICES = (
            ('1', 'Flute'),
            ('2', 'Piccolo'),
        )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, unique=False)
    instrument = models.CharField(max_length=20, choices=INSTRUMENT_CHOICES, unique=False)
    name = models.CharField(max_length=255, blank=True, null=True)
    composer = models.ForeignKey('Composer', related_name='composer', on_delete=models.CASCADE)

class Movement(models.Model):
    piece = models.ForeignKey('Piece', related_name='movements', on_delete=models.CASCADE)
    name = models.CharField(max_length=255, blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)

class Composer(models.Model):	
    firstName = models.CharField(max_length=255, blank=True, null=True)
    lastName = models.CharField(max_length=255, blank=True, null=True)
    birthYear = models.IntegerField(blank=True, null=True)
    deathYear = models.IntegerField(blank=True, null=True)

class Program(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    pageOrder = models.IntegerField(blank=False, null=False)

class ProgramSlot(models.Model):
    piece = models.ForeignKey('Piece', related_name="programSlots", on_delete=models.CASCADE)
    program = models.ForeignKey('Program', related_name="programSlots", on_delete=models.CASCADE)
    order = models.IntegerField(blank=False)
