from django.contrib import admin
from naga.models import *

class CharacterAdmin(admin.ModelAdmin):
    list_display = ('name',)

admin.site.register(Character, CharacterAdmin)

class SavingThrowAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'name', 'fieldValue', 'isProficient')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(SavingThrow, SavingThrowAdmin)

class AbilityScoreAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'name', 'fieldValue', 'isProficient')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(AbilityScore, AbilityScoreAdmin)

class WeaponNodeAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(WeaponNode, WeaponNodeAdmin)

class SkillNodeAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(SkillNode, SkillNodeAdmin)

class EquipmentNodeAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(EquipmentNode, EquipmentNodeAdmin)

class SpellNodeAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(SpellNode, SpellNodeAdmin)

class CustomPageAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName', 'templateName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(CustomPage, CustomPageAdmin)

class ImageWithTextAdmin(admin.ModelAdmin):
    list_display = ('get_charName', 'displayName')
    def get_charName(self, obj):
        return obj.character.name
    get_charName.short_description = "Character"

admin.site.register(ImageWithText, ImageWithTextAdmin)
