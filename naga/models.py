from django.db import models
from django.db.models import Case, When
import numexpr

class DndClass(models.Model):
    CLASS_CHOICES = (
            ('1', 'Rogue'),
            ('2', 'Wizard'),
            ('3', 'Bard'),
            ('4', 'Artificer'),
            ('5', 'Fighter'),
            ('6', 'Druid'),
        )
    name = models.CharField(max_length=20, choices=CLASS_CHOICES, unique=True)
    school = models.CharField(max_length=255, blank=True, null=True)
    level = models.IntegerField(blank=True, null=True)
    character = models.ForeignKey('Character', related_name='dndClasses', on_delete=models.CASCADE)
    isPrimaryAtkClass = models.BooleanField(default=False) #usually your main class
    isPrimarySpellClass = models.BooleanField(default=False) #usually your main class
    isSpellcastingClass = models.BooleanField(default=False) #e.g. Fighter no, Wizard yes
    
    def save(self, *args, **kwargs):
        isNew = False
        if not self.pk: #new object
            isNew = True
        super().save(*args, **kwargs)
        if isNew:
            knowsAllFromStart = self.get_name_display() in ['Druid', 'Artificer']
            self.createDefaultSpellNodes(known=knowsAllFromStart)
    
    def getSpellcastingAbilityMod(self):
        #tbd make better
        switcher = {
            "Wizard": self.character.getIntMod(),
            "Bard": self.character.getChaMod(),
            "Druid": self.character.getWisMod(),
            }
        return switcher.get(self.get_name_display(), self.character.getIntMod())

    def getSpellSaveDC(self):
        return (8+self.getSpellcastingAbilityMod()+self.character.proficiencyBonus)

    def getSpellAtkBonus(self):
        return (self.getSpellcastingAbilityMod()+self.character.proficiencyBonus)

    def getSpells(self, preparedOnly=False, known=True, showClassInName=False):
        sDict = {}
        levelList = []
        for i in range(10):
        #cantrips are level 0
            if i == 0: 
                #only ever shown known cantrips (note, they should always be prepared)
                spellNodes = self.spellNodes.filter(level=i, known=True)
            elif preparedOnly:
                spellNodes = self.spellNodes.filter(level=i, prepared=True, known=known)
            else:
                spellNodes = self.spellNodes.filter(level=i, known=known)
            for s in spellNodes:
                displayName = s.getDisplayName(showClassInName=showClassInName)
                if s.ritual == "True":
                    displayName+= " (Ritual)"
                popupContent = "<b>Casting Time: </b>%s<br><b>Duration: </b>%s<br><b>Components: </b>%s<br><b>Concentration: </b>%s<br><b>Area of Effect: </b>%s (%s shape)<br><b>Range: </b>%s<br><br>%s<br><br><i><small>%s</small></i>" % (s.castingTime, s.duration, s.components, s.concentration, s.areaOfEffect, s.areaShape, s.range, s.longDescription, s.source)
                spD = {
                        "displayName": displayName,
                        "level": s.level,
                        "prepared": s.prepared,
                        "popupContent": popupContent,
                    }
                levelList.append(spD)
            levelList = sorted(levelList, key=lambda spell:  spell['displayName'])
            levelList = sorted(levelList, key=lambda spell:  spell['prepared'], reverse=True)
            sDict[i] = levelList
            levelList = []
        return sDict
    
    def getNumSpellsPrepare(self):
        import math
        switcher = {
            "Wizard": (self.character.getIntMod() + self.level),
            "Artificer": (self.character.getIntMod() + max(1, math.floor(self.level/2)) ),
            "Druid": (self.character.getWisMod() + self.level),
            }
        return switcher.get(self.get_name_display(), (self.character.getIntMod()+self.level))

    def generalSpellLookup(self, className):
        return None #revist with below idea... but might not be necessary
    
    def createDefaultSpellNodes(self, known=False):
        import json, os
        from django.conf import settings
        filename = os.path.join(settings.STATIC_ROOT, "naga/spelldata.json")
        with open(filename, "r") as f:
            spellsToCopy = json.load(f)
        for key, spell in spellsToCopy.items():
            if self.get_name_display() in spell['lists']:
                newSpell = SpellNode()
                newSpell.copyFromRefNode(self, spell)
                if newSpell.level == 0: #cantrips come in prepared but unknown
                    newSpell.prepared = True
                    newSpell.known = False
                else:
                    newSpell.known = known
                newSpell.save()

class Character(models.Model):
    name = models.CharField(max_length=255)
    xp = models.IntegerField(blank=True, null=True)
    race = models.CharField(max_length=255)
    alignment = models.CharField(max_length=255)
    background = models.CharField(max_length=255, blank=True, null=True)
 
    age = models.CharField(max_length=255, blank=True, null=True)
    height = models.CharField(max_length=255, blank=True, null=True)
    weight = models.CharField(max_length=255, blank=True, null=True)
    eyes = models.CharField(max_length=255, blank=True, null=True)
    skin = models.CharField(max_length=255, blank=True, null=True)
    hair = models.CharField(max_length=255, blank=True, null=True)
    
    strength = models.IntegerField()
    dexterity = models.IntegerField()
    constitution = models.IntegerField()
    intelligence = models.IntegerField()
    wisdom = models.IntegerField()
    charisma = models.IntegerField()

    proficiencyBonus = models.IntegerField()
    inspiration = models.IntegerField(blank=True, null=True)

    ac = models.IntegerField()
    initiative = models.IntegerField(blank=True, null=True)
    speed = models.IntegerField()
    currentHP = models.IntegerField()
    tempHP = models.CharField(max_length=255, blank=True, null=True)
    hitDiceType = models.CharField(max_length=255)
    hitDice = models.CharField(max_length=255)

    personalityNotes = models.TextField(blank=True, null=True)
    proficienciesNotes = models.TextField(blank=True, null=True)
    weaponsNotes = models.TextField(blank=True, null=True)
    equipmentNotes = models.TextField(blank=True, null=True)
    
    alliesNotes = models.TextField(blank=True, null=True)
    backstoryNotes = models.TextField(blank=True, null=True)
    additionalNotes = models.TextField(blank=True, null=True)
    treasureNotes = models.TextField(blank=True, null=True)
    customNotesSlot1 = models.TextField(blank=True, null=True)

    headshot = models.ImageField(upload_to='naga/uploads/%s/'%name, blank=True, null=True)

    cp = models.IntegerField(blank=True, null=True)
    sp = models.IntegerField(blank=True, null=True)
    ep = models.IntegerField(blank=True, null=True)
    gp = models.IntegerField(blank=True, null=True)
    pp = models.IntegerField(blank=True, null=True)

    campaignJournal = models.TextField(blank=True, null=True)
    externalReferences = models.TextField(blank=True, null=True) #Out of character, links to stuff or player notes

    useSpellPage = models.BooleanField(default=True)
    lvl0slotsTotal = models.IntegerField(blank=True, null=True)
    lvl0slotsUsed = models.IntegerField(blank=True, null=True)
    lvl1slotsTotal = models.IntegerField(blank=True, null=True)
    lvl1slotsUsed = models.IntegerField(blank=True, null=True)
    lvl2slotsTotal = models.IntegerField(blank=True, null=True)
    lvl2slotsUsed = models.IntegerField(blank=True, null=True)
    lvl3slotsTotal = models.IntegerField(blank=True, null=True)
    lvl3slotsUsed = models.IntegerField(blank=True, null=True)
    lvl4slotsTotal = models.IntegerField(blank=True, null=True)
    lvl4slotsUsed = models.IntegerField(blank=True, null=True)
    lvl5slotsTotal = models.IntegerField(blank=True, null=True)
    lvl5slotsUsed = models.IntegerField(blank=True, null=True)
    lvl6slotsTotal = models.IntegerField(blank=True, null=True)
    lvl6slotsUsed = models.IntegerField(blank=True, null=True)
    lvl7slotsTotal = models.IntegerField(blank=True, null=True)
    lvl7slotsUsed = models.IntegerField(blank=True, null=True)
    lvl8slotsTotal = models.IntegerField(blank=True, null=True)
    lvl8slotsUsed = models.IntegerField(blank=True, null=True)
    lvl9slotsTotal = models.IntegerField(blank=True, null=True)
    lvl9slotsUsed = models.IntegerField(blank=True, null=True)

    def save(self, *args, **kwargs):
        isNew = False
        if not self.pk: #new object
            isNew = True
        super().save(*args, **kwargs)
        if isNew:
            self.createDefaultAbilities()
            self.createDefaultSavingThrows()

    def getDndClassDisplay(self):
        displayStr=''
        for c in self.dndClasses.all():
            if c.school:
                displayStr+=c.get_name_display() + ' (' + c.school + ')/'
            else:
                displayStr+=c.get_name_display() + '/'
        displayStr = displayStr[:-1]
        return displayStr

    def getLevelDisplay(self):
        displayStr=''
        for c in self.dndClasses.all():
            displayStr+=str(c.level) + '/'
        displayStr = displayStr[:-1]
        return displayStr

    def getPrimaryAtkClass(self):
        c = list(self.dndClasses.filter(isPrimaryAtkClass=True))
        return c[0]
    def getPrimarySpellClass(self):
        c = list(self.dndClasses.filter(isPrimarySpellClass=True))
        if c:
            return c[0]
        return None
    def getSecondarySpellClass(self):
        c = list(self.dndClasses.filter(isPrimarySpellClass=False, isSpellcastingClass=True))
        if c:
            return c[0]
        return None
    def getSpellcastingClasses(self):
        c = list(self.dndClasses.filter(isSpellcastingClass=True))
        return c

    def getTopAttrs(self):
        attrs = [
                {"displayname":"Class", "value":self.getDndClassDisplay()},
                {"displayname":"Level", "value":self.getLevelDisplay()},
                {"displayname":"Race", "value":self.race},
                {"displayname":"Background", "value":self.background},
                {"displayname":"Alignment", "value":self.alignment},
                {"displayname":"Experience", "value":self.xp},
                ]
        return attrs

    def getStats(self):
        stats = [
                {"displayname":"Strength", "value":self.strength, "mod":self.getStrMod()},
                {"displayname":"Dexterity", "value":self.dexterity, "mod":self.getDexMod()},
                {"displayname":"Constitution", "value":self.constitution, "mod":self.getConMod()},
                {"displayname":"Intelligence", "value":self.intelligence, "mod":self.getIntMod()},
                {"displayname":"Wisdom", "value":self.wisdom, "mod":self.getWisMod()},
                {"displayname":"Charisma", "value":self.charisma, "mod":self.getChaMod()},
                ]
        return stats
    
    def getAtkBonus(self):
        return (self.proficiencyBonus + self.getAtkStat())

    def getAtkStat(self):
        #tbd make better
        switcher = {
            "Rogue": self.getDexMod(),
            "Wizard": self.getDexMod(),
            "Bard": self.getDexMod(),
            "Fighter": self.getStrMod(),
            "Druid": self.getDexMod(),
            }
        return switcher.get(self.getPrimaryAtkClass().get_name_display(), self.getStrMod())

    def getMod(self, stat):
        base = stat-10
        if base % 2 >0:
            return int((base-1)/2)
        else:
            return int(base/2)
    def getStrMod(self):
        return self.getMod(self.strength)
    def getDexMod(self):
        return self.getMod(self.dexterity)
    def getConMod(self):
        return self.getMod(self.constitution)
    def getIntMod(self):
        return self.getMod(self.intelligence)
    def getWisMod(self):
        return self.getMod(self.wisdom)
    def getChaMod(self):
        return self.getMod(self.charisma)

    def getMoney(self):
        money = {
                "cp": self.cp if self.cp else 0,
                "sp": self.sp if self.sp else 0,
                "gp": self.gp if self.gp else 0,
                "ep": self.ep if self.ep else 0,
                "pp": self.pp if self.pp else 0,
                }
        return money
    
    def getSavingThrows(self):
        sList = []
        for s in self.savingThrows.all():
            sDict = {
                    "displayname": s.name, 
                    "value": calculateDisplayValue(s), 
                    "isProficient": s.isProficient,
                    }
            sList.append(sDict)
        return sList

    def createDefaultSavingThrows(self):
        startingSet = [
            ("Strength", None, "Str", 1),
            ("Dexterity", None, "Dex", 2),
            ("Constitution", None, "Con", 3),
            ("Intelligence", None, "Int", 4),
            ("Wisdom", None, "Wis", 5),
            ("Charisma", None, "Cha", 6),
        ]
        for (name, fieldValue, parentStat, orderindex) in startingSet:
            sthrow = SavingThrow(name=name, fieldValue=fieldValue, parentStat=parentStat, orderindex=orderindex, character=self)
            sthrow.save()
    
    def getAbilities(self):
        aList = []
        for a in self.abilities.all():
            aDict = {
                    "displayname": a.name, 
                    "value": calculateDisplayValue(a), 
                    "isProficient": a.isProficient,
                    "parentStat": a.parentStat,
                    }
            aList.append(aDict)
        return aList

    def getPassivePerception(self):
        p = self.abilities.filter(name='Perception')
        return (10 + int(calculateDisplayValue(p[0])))

    def createDefaultAbilities(self):
        startingSet = [
            ("Acrobatics", None, "Dex"),
            ("Animal Handling", None, "Wis"),
            ("Arcana", None, "Int"),
            ("Athletics", None, "Str"),
            ("Deception", None, "Cha"),
            ("History", None, "Int"),
            ("Insight", None, "Wis"),
            ("Intimidation", None, "Cha"),
            ("Investigation", None, "Int"),
            ("Medicine", None, "Wis"),
            ("Nature", None, "Int"),
            ("Perception", None, "Wis"),
            ("Performance", None, "Cha"),
            ("Persuasion", None, "Cha"),
            ("Religion", None, "Int"),
            ("Sleight of Hand", None, "Dex"),
            ("Stealth", None, "Dex"),
            ("Survival", None, "Wis"),
        ]
        for (name, fieldValue, parentStat) in startingSet:
            abil = AbilityScore(name=name, fieldValue=fieldValue, parentStat=parentStat, character=self)
            abil.save()

    def getWeapons(self):
        wList = []
        for w in self.weaponNodes.all():
            wDict = {
                    "displayName": w.displayName, 
                    "longDescription": w.longDescription, 
                    "damage": str(w.damage) + ' (+' + str(w.getDamageBonus()) + ')',
                    "attackBonus": w.getAttackBonus(),
                    }
            wList.append(wDict)
        return wList

    def getSkills(self):
        sList = []
        for s in self.skillNodes.all():
            sDict = {
                    "displayName": s.displayName, 
                    "longDescription": s.longDescription, 
                    }
            sList.append(sDict)
        return sList
    
    def getEquipment(self):
        eList = []
        for e in self.equipmentNodes.all():
            eDict = {
                    "displayName": e.displayName, 
                    "longDescription": e.longDescription, 
                    }
            eList.append(eDict)
        return eList

    def getAllSpells(self, includeSecondary=True, preparedOnly=False, secondaryPreparedOnly=False, known=True, showClassInName=False):
        sps = self.getPrimarySpellClass().getSpells(known=known, preparedOnly=preparedOnly, showClassInName=showClassInName)
        for c in self.dndClasses.all():
            if c.isSpellcastingClass and not c.isPrimarySpellClass and includeSecondary:
                addSps = c.getSpells(preparedOnly=(preparedOnly or secondaryPreparedOnly), known=known, showClassInName=showClassInName)
                newSps = {}
                for key in sps.keys():
                    newSps[key] = sps[key] + addSps[key]
                sps = newSps
        return sps
    
    def getCustomPages(self):
        pList = []
        for p in self.customPages.all():
            pDict = {
                    "displayName": p.displayName, 
                    "templateName": p.templateName,
                    "orderindex": p.orderindex,
                    }
            pList.append(pDict)
        pList = sorted(pList, key=lambda page:  page['orderindex'])
        return pList
    
    def getImageWithTexts(self):
        iList = []
        for i in self.imageWithTexts.all():
            iDict = {
                    "displayName": i.displayName, 
                    "image": i.image, 
                    "text": i.text,
                    }
            iList.append(iDict)
        return iList

    def getSpecialCharacterDict(self):
        #space to fill in custom things for character custom pages
        myDict = {}
        if self.name == "Merb":
            myDict = {
                    "combinedPreparedSpells": self.getAllSpells(preparedOnly=True, showClassInName=True),
                    }
        return myDict


class SavingThrow(models.Model):
    character = models.ForeignKey('Character', related_name='savingThrows', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    fieldValue = models.CharField(max_length=255, blank=True, null=True)
    isProficient = models.BooleanField(default=False)
    parentStat = models.CharField(max_length=255)
    orderindex = models.IntegerField()

class AbilityScore(models.Model):
    character = models.ForeignKey('Character', related_name='abilities', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    fieldValue = models.CharField(max_length=255, blank=True, null=True)
    parentStat = models.CharField(max_length=255)
    isProficient = models.BooleanField(default=False)

#used by SavingThrow and AbilityScore
def calculateDisplayValue(obj):
    getMod = getattr(obj.character, 'get%sMod'%(obj.parentStat))
    baseStat = getMod()

    if obj.fieldValue:
        if obj.fieldValue[0] == "=":
            #they've filled in a formula
            formattedVal = obj.fieldValue[1:]
            formattedVal = formattedVal.replace('P', str(obj.character.proficiencyBonus))
            formattedVal = formattedVal.replace('M', str(baseStat))
            return numexpr.evaluate(formattedVal).item()
        else:
            #they've filled in an override
            return obj.fieldValue
    
    if obj.isProficient:
        return (baseStat + obj.character.proficiencyBonus)
    return baseStat

class CustomPage(models.Model):
    character = models.ForeignKey('Character', related_name='customPages', on_delete=models.CASCADE)
    displayName = models.CharField(max_length=255)
    templateName = models.CharField(max_length=255)
    orderindex = models.IntegerField()

class Node(models.Model):
    displayName = models.CharField(max_length=255)
    longDescription = models.TextField(blank=True, null=True)
    orderindex = models.IntegerField(blank=True, null=True)

class WeaponNode(Node):
    character = models.ForeignKey('Character', related_name='weaponNodes', on_delete=models.CASCADE)
    damage = models.CharField(max_length=255, blank=True, null=True)
    abilityModifier = models.CharField(max_length=255, blank=True, null=True) #Str or Dex, usually
    proficient = models.BooleanField(default=True) #usually you don't choose weapons that you aren't proficient with
    
    def getDamageBonus(self):
        mod = 0
        if self.abilityModifier=="Str":
            mod = self.character.getStrMod()
        elif self.abilityModifier=="Dex":
            mod = self.character.getDexMod()
        return mod

    def getAttackBonus(self):
        if self.proficient:
            return ( self.character.proficiencyBonus+self.getDamageBonus() )
        else:
            return self.getDamageBonus()


class SkillNode(Node):
    character = models.ForeignKey('Character', related_name='skillNodes', on_delete=models.CASCADE)

class EquipmentNode(Node):
    character = models.ForeignKey('Character', related_name='equipmentNodes', on_delete=models.CASCADE)

class SpellNode(Node):
    #attached to a class, which is attached to a character
    dndClass = models.ForeignKey('DndClass', related_name='spellNodes', on_delete=models.CASCADE)
    prepared = models.BooleanField() #cantrips are always prepared, but not always known
    level = models.IntegerField() #cantrips should be level 0
    castingTime = models.CharField(max_length=255, blank=True, null=True)
    ritual = models.CharField(max_length=255, blank=True, null=True)
    duration = models.CharField(max_length=255, blank=True, null=True)
    school = models.CharField(max_length=255, blank=True, null=True)
    components = models.CharField(max_length=255, blank=True, null=True)
    concentration = models.CharField(max_length=255, blank=True, null=True)
    areaOfEffect = models.CharField(max_length=255, blank=True, null=True)
    areaShape = models.CharField(max_length=255, blank=True, null=True)
    range = models.CharField(max_length=255, blank=True, null=True)
    source = models.CharField(max_length=255, blank=True, null=True)
    pageNumber = models.CharField(max_length=255, blank=True, null=True)
    meleeWeaponAttack = models.CharField(max_length=255, blank=True, null=True)
    rangedWeaponAttack = models.CharField(max_length=255, blank=True, null=True)
    meleeSpellAttack = models.CharField(max_length=255, blank=True, null=True)
    rangedSpellAttack = models.CharField(max_length=255, blank=True, null=True)
    url = models.CharField(max_length=255, blank=True, null=True)
    school = models.CharField(max_length=255, blank=True, null=True)
    lists = models.CharField(max_length=255, blank=True, null=True)
    dataSource = models.CharField(max_length=255, blank=True, null=True)
    htmlDescription = models.TextField(blank=True, null=True)
    known = models.BooleanField(default=False)

    def getDisplayName(self, showClassInName=False):
        if showClassInName:
            return self.displayName + ' (%s)' % (self.dndClass.get_name_display())
        else:
            return self.displayName

    def copyFromRefNode(self, dndClass, refNode):
        self.dndClass = dndClass
        self.prepared = False
        self.level = refNode.get('level')
        self.displayName = refNode.get('name')
        self.longDescription = refNode.get('description')
        self.castingTime = refNode.get('casting-time')
        self.ritual = refNode.get('ritual')
        self.duration = refNode.get('duration')
        self.school = refNode.get('school')
        self.components = refNode.get('components')
        self.concentration = refNode.get('concentration')
        self.areaOfEffect = refNode.get('aoe')
        self.areaShape = refNode.get('aoe_shape')
        self.range = refNode.get('range-area')
        self.source = refNode.get('source')
        self.pageNumber = refNode.get('page_number')
        self.meleeWeaponAttack = refNode.get('melee-weapon-attack')
        self.rangedWeaponAttack = refNode.get('ranged-weapon-attack')
        self.meleeSpellAttack = refNode.get('melee-spell-attack')
        self.rangedSpellAttack = refNode.get('ranged-spell-attack')
        self.url = refNode.get('url')
        self.school = refNode.get('school')
        self.lists = refNode.get('lists')
        self.dataSource = refNode.get('datasource')
        self.htmlDescription = refNode.get('html_description')

class ImageWithText(models.Model):
    #e.g. Saren Identities
    character = models.ForeignKey('Character', related_name='imageWithTexts', on_delete=models.CASCADE)
    displayName = models.CharField(max_length=255)
    image = models.ImageField(upload_to='naga/uploads/%s/'%character.name)
    text = models.TextField()
