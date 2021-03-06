# Generated by Django 3.0.6 on 2020-05-17 07:44

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('naga', '0005_character_usespellpage'),
    ]

    operations = [
        migrations.RenameField(
            model_name='character',
            old_name='miscWeaponNotes',
            new_name='weaponNotes',
        ),
        migrations.AlterField(
            model_name='weaponnode',
            name='abilityModifier',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='weaponnode',
            name='damage',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.CreateModel(
            name='EquipmentNode',
            fields=[
                ('node_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='naga.Node')),
                ('character', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='equipmentNodes', to='naga.Character')),
            ],
            bases=('naga.node',),
        ),
    ]
