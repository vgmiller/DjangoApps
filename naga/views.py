from django.shortcuts import render, get_object_or_404, redirect
from naga.models import Character, Node
from django.views.generic import UpdateView, ListView
from django.http import HttpResponse
from django.template.loader import render_to_string
from naga.forms import NodeForm
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm

def naga_index(request):
    characters = Character.objects.all()
    context = {
        "user": request.user,
        "characters": characters,
    }
    return render(request, "naga_index.html", context)

def naga_characterHome(request, name):
    character = get_object_or_404(Character, name=name)

    context = {
        "user": request.user,
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
        context['spells'] = cls.getSpells()
        context['spellcastingClass'] = cls.get_name_display()
        context['spellcastingLevel'] = cls.level
        context['spellcastingAbility'] = cls.getSpellcastingAbilityMod()
        context['spellSaveDC'] = cls.getSpellSaveDC()
        context['spellAtkBonus'] = cls.getSpellAtkBonus()
        context['numPrepare'] = cls.getNumSpellsPrepare()
    if character.getSecondarySpellClass():
        cls = character.getSecondarySpellClass()
        context['s_spells'] = cls.getSpells()
        context['s_spellcastingClass'] = cls.get_name_display()
        context['s_spellcastingLevel'] = cls.level
        context['s_spellcastingAbility'] = cls.getSpellcastingAbilityMod()
        context['s_spellSaveDC'] = cls.getSpellSaveDC()
        context['s_spellAtkBonus'] = cls.getSpellAtkBonus()
        context['s_numPrepare'] = cls.getNumSpellsPrepare()


    return render(request, "naga_characterHome.html", context)

def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=raw_password)
            login(request, user)
            return redirect('myProfile')
    else:
        form = UserCreationForm()
    return render(request, 'registration/signup.html', {'form': form})

def myProfile(request):
    context = {
        "user": request.user,
    }
    return render(request, 'registration/profile.html', context)

def naga_publicCharacterSummary(request):
	from django.http import JsonResponse
	characters = Character.objects.all()
	charList = []
	for char in characters:
		cDict = {
			"Name": char.name,
			"Race": char.race,
			"Alignment": char.alignment,
			"AC": char.ac,
			"HP": char.currentHP,
			"Speed": char.speed,
			"Class": char.getDndClassDisplay(),
			"Level": char.getLevelDisplay(),
			"Passive Perception": char.getPassivePerception(),
		}
		charList.append(cDict)
	return JsonResponse(charList, safe=False)

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
