# Generated by Django 3.0.6 on 2020-05-17 22:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('naga', '0007_auto_20200517_0805'),
    ]

    operations = [
        migrations.AddField(
            model_name='character',
            name='customNotesSlot1',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='character',
            name='headshot',
            field=models.ImageField(blank=True, null=True, upload_to='naga/uploads/<django.db.models.fields.CharField>/'),
        ),
        migrations.CreateModel(
            name='ImageWithText',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(blank=True, null=True, upload_to='naga/uploads/None/')),
                ('text', models.TextField()),
                ('character', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='imageWithTexts', to='naga.Character')),
            ],
        ),
    ]
