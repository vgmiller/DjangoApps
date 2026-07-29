import random
import string

from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


def gen_invite_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


class Profile(models.Model):
    # movie_night's original User had email/password/name (Django auth already
    # provides these) plus a phone_number field, which lives here instead of
    # patching a custom user model onto an existing project.
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="movie_night_profile")
    phone_number = models.CharField(max_length=32, blank=True, null=True)

    def __str__(self):
        return self.user.get_username()


class Group(models.Model):
    name = models.CharField(max_length=255)
    invite_code = models.CharField(max_length=8, unique=True, default=gen_invite_code)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="movie_night_groups_created")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self._state.adding:
            while Group.objects.filter(invite_code=self.invite_code).exists():
                self.invite_code = gen_invite_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class GroupRole(models.TextChoices):
    OWNER = "owner", "Owner"
    MEMBER = "member", "Member"


class GroupMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="movie_night_memberships")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")
    role = models.CharField(max_length=16, choices=GroupRole.choices, default=GroupRole.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "group")

    def __str__(self):
        return f"{self.user} in {self.group} ({self.role})"


class ActivityType(models.TextChoices):
    MOVIE = "movie", "Movie"
    TV = "tv", "TV"
    OTHER = "other", "Other"


class Activity(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="activities")
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="movie_night_activities")
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=16, choices=ActivityType.choices, default=ActivityType.MOVIE)
    imdb_url = models.URLField(max_length=512, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class InterestLevel(models.TextChoices):
    DEFINITELY_INTERESTED = "definitely_interested", "Definitely interested"
    SURE_WHY_NOT = "sure_why_not", "Sure, why not"
    DEFINITELY_NOT = "definitely_not", "Definitely not"


class ActivityInterest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="movie_night_interests")
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="interests")
    level = models.CharField(max_length=32, choices=InterestLevel.choices)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "activity")

    def __str__(self):
        return f"{self.user} -> {self.activity}: {self.level}"


class AvailabilitySlot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="movie_night_availability_slots")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="availability_slots")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    class Meta:
        indexes = [models.Index(fields=["user", "group"])]

    def __str__(self):
        return f"{self.user} {self.start_time} - {self.end_time}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="movie_night_notifications")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="notifications", blank=True, null=True)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "read"])]

    def __str__(self):
        return self.message[:50]
