from django.db import models
from django.db.models import Case, When

class Character(models.Model):
    name = models.CharField(max_length=255)
    dndClass = models.CharField(max_length=255)
    level = models.CharField(max_length=255)
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

    useSpellPage = models.BooleanField(default=True)
    spellcastingClass = models.CharField(max_length=255, blank=True, null=True)
    spellcastingAbility = models.CharField(max_length=255, blank=True, null=True)
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
    
    campaignJournal = models.TextField(blank=True, null=True)
    externalReferences = models.TextField(blank=True, null=True) #Out of character, links to stuff or player notes

    def save(self, *args, **kwargs):
        isNew = False
        if not self.pk: #new object
            isNew = True
        super().save(*args, **kwargs)
        if isNew:
            self.createDefaultAbilities()
            self.createSavingThrows()

    def getTopAttrs(self):
        attrs = [
                {"displayname":"Class", "value":self.dndClass},
                {"displayname":"Level", "value":self.level},
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
            }
        return switcher.get(self.dndClass, self.getStrMod())

    def getSpellcastingAbilityMod(self):
        #tbd make better
        switcher = {
            "Wizard": self.getIntMod(),
            "Bard": self.getChaMod(),
            "Druid": self.getWisMod(),
            }
        return switcher.get(self.spellcastingClass, self.getIntMod())

    def getSpellSaveDC(self):
        return (8+self.getIntMod()+self.proficiencyBonus)

    def getSpellAtkBonus(self):
        return (self.getSpellcastingAbilityMod()+self.proficiencyBonus)

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
                    "value": s.calculateDisplayValue(), 
                    "isProficient": s.isProficient,
                    }
            sList.append(sDict)
        return sList

    def createDefaultSavingThrows(self):
        startingSet = [
            ("Strength", self.getStrMod(),1),
            ("Dexterity", self.getDexMod(),2),
            ("Constitution", self.getConMod(),3),
            ("Intelligence", self.getIntMod(),4),
            ("Wisdom", self.getWisMod(),5),
            ("Charisma", self.getChaMod(),6),
        ]
        for (name, fieldValue, orderindex) in startingSet:
            sthrow = SavingThrow(name=name, fieldValue=fieldValue, orderindex=orderindex, character=self)
            sthrow.save()
    
    def getAbilities(self):
        aList = []
        for a in self.abilities.all():
            aDict = {
                    "displayname": a.name, 
                    "value": a.calculateDisplayValue(), 
                    "isProficient": a.isProficient,
                    "parentStat": a.parentStat,
                    }
            aList.append(aDict)
        return aList

    def createDefaultAbilities(self):
        startingSet = [
            ("Acrobatics", self.getDexMod(), "Dex"),
            ("Animal Handling", self.getWisMod(), "Wis"),
            ("Arcana", self.getIntMod(), "Int"),
            ("Athletics", self.getStrMod(), "Str"),
            ("Deception", self.getChaMod(), "Cha"),
            ("History", self.getIntMod(), "Int"),
            ("Insight", self.getWisMod(), "Wis"),
            ("Intimidation", self.getChaMod(), "Cha"),
            ("Investigation", self.getIntMod(), "Int"),
            ("Medicine", self.getWisMod(), "Wis"),
            ("Nature", self.getIntMod(), "Int"),
            ("Perception", self.getWisMod(), "Wis"),
            ("Performance", self.getChaMod(), "Cha"),
            ("Persuasion", self.getChaMod(), "Cha"),
            ("Religion", self.getIntMod(), "Int"),
            ("Sleight of Hand", self.getDexMod(), "Dex"),
            ("Stealth", self.getDexMod(), "Dex"),
            ("Survival", self.getWisMod(), "Wis"),
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
                    "damage": w.damage,
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

    def getSpells(self):
        sDict = {}
        levelList = []
        for i in range(10):
            for s in self.spellNodes.filter(level=i): #cantrips should be level 0
                levelList.append(s)
            sDict[i] = levelList
            levelList = []
        return sDict
    
    def getCustomPages(self):
        pList = []
        for p in self.customPages.all():
            pDict = {
                    "displayName": p.displayName, 
                    "templateName": p.templateName,
                    "orderindex": p.orderindex,
                    }
            pList.append(pDict)
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

class SavingThrow(models.Model):
    character = models.ForeignKey('Character', related_name='savingThrows', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    fieldValue = models.CharField(max_length=255)
    isProficient = models.BooleanField(default=False)
    orderindex = models.IntegerField()

    def calculateDisplayValue(self):
        #tbd more here later for formulas
        return int(self.fieldValue)

class AbilityScore(models.Model):
    character = models.ForeignKey('Character', related_name='abilities', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    fieldValue = models.CharField(max_length=255)
    parentStat = models.CharField(max_length=255)
    isProficient = models.BooleanField(default=False)

    def calculateDisplayValue(self):
        #tbd more here later for formulas
        return int(self.fieldValue)

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
    
    def getAttackBonus(self):
        mod = 0
        if self.abilityModifier=="Str":
            mod = self.character.getStrMod()
        elif self.abilityModifier=="Dex":
            mod = self.character.getDexMod()
        return (self.character.proficiencyBonus+mod)


class SkillNode(Node):
    character = models.ForeignKey('Character', related_name='skillNodes', on_delete=models.CASCADE)

class EquipmentNode(Node):
    character = models.ForeignKey('Character', related_name='equipmentNodes', on_delete=models.CASCADE)

class SpellNode(Node):
    character = models.ForeignKey('Character', related_name='spellNodes', on_delete=models.CASCADE)
    prepared = models.BooleanField()
    level = models.IntegerField() #cantrips should be level 0
    #tbd make better
    dndClass = models.CharField(max_length=255)

class ImageWithText(models.Model):
    #e.g. Saren Identities
    character = models.ForeignKey('Character', related_name='imageWithTexts', on_delete=models.CASCADE)
    displayName = models.CharField(max_length=255)
    image = models.ImageField(upload_to='naga/uploads/%s/'%character.name)
    text = models.TextField()
