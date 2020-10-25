from django.contrib import admin
from naga.models import *
from django.forms import ModelChoiceField


class CharacterAdmin(admin.ModelAdmin):
    list_display = ('name',)

admin.site.register(Character, CharacterAdmin)

class CharacterChoiceField(ModelChoiceField):
    def label_from_instance(self, character_instance):
        return character_instance.name

class DndClassAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'name')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
admin.site.register(DndClass, DndClassAdmin)

class DndClassChoiceField(ModelChoiceField):
    def label_from_instance(self, class_instance):
        return class_instance.get_name_display() + " (" + class_instance.character.name + ")"

class SavingThrowAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'name', 'fieldValue', 'isProficient')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(SavingThrow, SavingThrowAdmin)

class AbilityScoreAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'name', 'fieldValue', 'isProficient')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(AbilityScore, AbilityScoreAdmin)

class WeaponNodeAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(WeaponNode, WeaponNodeAdmin)

class SkillNodeAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(SkillNode, SkillNodeAdmin)

class EquipmentNodeAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(EquipmentNode, EquipmentNodeAdmin)

class SpellNodeAdmin(admin.ModelAdmin):
    list_display = ('displayName', 'get_charName','get_className', 'level', 'prepared')
    def get_charName(self, obj):
        return obj.dndClass.character.name
    get_charName.short_description = "Character"
    def get_className(self, obj):
        return obj.dndClass.get_name_display()
    get_className.short_description = "Dnd Class"

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'dndClass':
            return DndClassChoiceField(queryset=DndClass.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
admin.site.register(SpellNode, SpellNodeAdmin)

class CustomPageAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName', 'templateName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(CustomPage, CustomPageAdmin)

class ImageWithTextAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'character':
            return CharacterChoiceField(queryset=Character.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(ImageWithText, ImageWithTextAdmin)
