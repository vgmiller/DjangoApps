from django.shortcuts import render
from naga.models import Character, Node
from django.views.generic import UpdateView, ListView
from django.http import HttpResponse
from django.template.loader import render_to_string
from naga.forms import NodeForm

def naga_index(request):
    characters = Character.objects.all()
    context = {
        "characters": characters,
    }
    return render(request, "naga_index.html", context)

def naga_characterHome(request, name):
    character = Character.objects.get(name=name)

    context = {
        "character": character,
        "customPages": character.getCustomPages(),
        "topAttrs": character.getTopAttrs(),
        "stats": character.getStats(),
        "savingThrows": character.getSavingThrows(),
        "abilities": character.getAbilities(),
        "passivePerception": character.getPassivePerception(),
        "carryingWeight": (character.strength*15),
        "weapons": character.getWeapons(),
        "equipment": character.getEquipment(),
        "skills": character.getSkills(),
        "imageWithTexts": character.getImageWithTexts(),
        "money": character.getMoney(),
        "specialCharacterDict": character.getSpecialCharacterDict(),
    }
    
    if character.getPrimarySpellClass():
        cls = character.getPrimarySpellClass()
        context['spells'] = character.getAllSpells(secondaryPreparedOnly=True)
        context['spellcastingClass'] = cls.get_name_display()
        context['spellcastingAbility'] = cls.getSpellcastingAbilityMod()
        context['spellSaveDC'] = cls.getSpellSaveDC()
        context['spellAtkBonus'] = cls.getSpellAtkBonus()
        context['numPrepare'] = cls.getNumSpellsPrepare()

    return render(request, "naga_characterHome.html", context)

"""
Nodes list
"""
class NodeListView(ListView):
    model = Node
    template_name = 'naga_node_list.html'

    def get_queryset(self):
        return Node.objects.all()

"""
Edit node
"""
class NodeUpdateView(UpdateView):
    model = Node
    form_class = NodeForm
    template_name = 'naga_node_edit_form.html'

    def dispatch(self, *args, **kwargs):
        self.node_id = kwargs['pk']
        return super(NodeUpdateView, self).dispatch(*args, **kwargs)

    def form_valid(self, form):
        form.save()
        node = Node.objects.get(id=self.node_id)
        return HttpResponse(render_to_string('naga_node_edit_form_success.html', {'node': node}))
