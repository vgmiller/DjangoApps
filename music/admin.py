from django.contrib import admin
from music.models import *
from django.forms import ModelChoiceField


class PieceAdmin(admin.ModelAdmin):
    list_display = ('get_composerName', 'name',)
    def get_composerName(self, obj):
        return obj.composer.lastName
    get_composerName.short_description = "Composer"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'composer':
            return ComposerChoiceField(queryset=Composer.objects.order_by('lastName'))
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(Piece, PieceAdmin)

class PieceChoiceField(ModelChoiceField):
    def label_from_instance(self, piece_instance):
        return "%s %s" % (piece_instance.composer.lastName, piece_instance.name)

class MovementAdmin(admin.ModelAdmin):
    list_display = ('get_pieceName', 'name', 'order')
    def get_pieceName(self, obj):
        return obj.piece.name
    get_pieceName.short_description = "Piece"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'piece':
            return PieceChoiceField(queryset=Piece.objects.order_by('composer__lastName'))
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
admin.site.register(Movement, MovementAdmin)

class ComposerAdmin(admin.ModelAdmin):
    list_display = ('lastName', 'firstName',)

admin.site.register(Composer, ComposerAdmin)

class ComposerChoiceField(ModelChoiceField):
    def label_from_instance(self, composer_instance):
        return composer_instance.lastName

class ProgramAdmin(admin.ModelAdmin):
    list_display = ('name','description')

admin.site.register(Program, ProgramAdmin)

class ProgramChoiceField(ModelChoiceField):
    def label_from_instance(self, program_instance):
        return program_instance.name

class ProgramSlotAdmin(admin.ModelAdmin):
    list_display = ('get_programName', 'get_pieceName', 'order')
    def get_pieceName(self, obj):
        return obj.piece.name
    get_pieceName.short_description = "Piece"
    def get_programName(self, obj):
        return obj.program.name
    get_programName.short_description = "Program"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'piece':
            return PieceChoiceField(queryset=Piece.objects.order_by('composer__lastName'))
        if db_field.name == 'program':
            return ProgramChoiceField(queryset=Program.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
admin.site.register(ProgramSlot, ProgramSlotAdmin)
