# Generated by Django 3.0.6 on 2020-05-17 22:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('naga', '0009_imagewithtext_displayname'),
    ]

    operations = [
        migrations.AlterField(
            model_name='imagewithtext',
            name='image',
            field=models.ImageField(upload_to='naga/uploads/None/'),
        ),
    ]
