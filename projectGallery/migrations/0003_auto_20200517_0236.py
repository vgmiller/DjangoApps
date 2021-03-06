# Generated by Django 3.0.6 on 2020-05-17 02:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projectGallery', '0002_auto_20200517_0107'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='summary',
            field=models.CharField(default='test', max_length=100),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='project',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='projectGallery/uploads/'),
        ),
        migrations.AlterField(
            model_name='project',
            name='technology',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
