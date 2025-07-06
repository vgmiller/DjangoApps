from django.db import models


class Walk(models.Model):
    distance = models.DecimalField(blank=False, null=False, decimal_places=8, max_digits=16)  # in miles
    duration = models.IntegerField(blank=False, null=False)  # milliseconds
    startDateTime = models.DateTimeField(blank=False, null=False)
    # endDateTime = models.DateTimeField(blank=False, null=False)
    steps = models.IntegerField(blank=True, null=True)
    fitbitLogId = models.IntegerField(blank=True, null=True)


class Event(models.Model):
    distanceFromShire = models.DecimalField(blank=False, null=False, decimal_places=8, max_digits=16)  # in miles
    distanceFromLastEvent = models.DecimalField(blank=False, null=False, decimal_places=8, max_digits=16)  # in miles
    text = models.TextField(blank=False, null=False)
    # previousEvent = models.ForeignKey('Event', on_delete=models.SET_NULL, null=True)
    # nextEvent = models.ForeignKey('Event', on_delete=models.SET_NULL, null=True)


class MajorMilestone(models.Model):
    distanceFromShire = models.DecimalField(blank=False, null=False, decimal_places=8, max_digits=16)  # in miles
    distanceFromLastMilestone = models.DecimalField(
        blank=False, null=False, decimal_places=8, max_digits=16
    )  # in miles
    text = models.TextField(blank=False, null=False)
    position = models.IntegerField(blank=False, null=False)  # i.e. 1st/2nd/3rd
    # previousEvent = models.ForeignKey('Event', on_delete=models.SET_NULL, null=True)
    # nextEvent = models.ForeignKey('Event', on_delete=models.SET_NULL, null=True)


class CurrentStatus(models.Model):
    # singleton class

    totalDistanceWalked = models.DecimalField(blank=False, null=False, decimal_places=8, max_digits=16)  # in miles
    totalNumberOfWalks = models.IntegerField(blank=True, null=True)
    totalTimeWalked = models.IntegerField(blank=True, null=True)  # milliseconds
    lastWalk = models.ForeignKey("Walk", related_name="lastWalk", on_delete=models.SET_NULL, null=True)
    firstWalk = models.ForeignKey("Walk", related_name="firstWalk", on_delete=models.SET_NULL, null=True)
    currentEvent = models.ForeignKey("Event", on_delete=models.SET_NULL, null=True)
    daysSinceStart = models.IntegerField(blank=True, null=True)
    daysWalked = models.IntegerField(blank=True, null=True)
    # mapProgressPercentage?

    def save(self, *args, **kwargs):
        self.pk = 1
        super(CurrentStatus, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def update(self):
        import datetime

        import pytz

        def localize(utcDatetime):
            if utcDatetime.tzinfo is None:
                utcDatetime = utcDatetime.replace(tzinfo=pytz.utc)
            return utcDatetime.astimezone(pytz.timezone("US/Eastern")).date()

        walks = Walk.objects.all().order_by("startDateTime")
        totalDistanceWalked = 0
        totalNumberOfWalks = 0
        totalTimeWalked = 0
        daysWalked = 0
        currWorkingDate = localize(datetime.datetime(1970, 1, 1))  # arbitrary unix epoch start

        for walk in walks:
            if localize(walk.startDateTime) != currWorkingDate:
                currWorkingDate = localize(walk.startDateTime)
                daysWalked += 1
            totalDistanceWalked += walk.distance
            totalNumberOfWalks += 1
            totalTimeWalked += walk.duration

        lastWalk = walks.last()
        firstWalk = walks.first()
        currentEvent = None
        daysSinceStart = (
            localize(datetime.datetime.now(pytz.utc)) - localize(firstWalk.startDateTime)
        ).days + 1  # inclusive of today

        self.totalDistanceWalked = totalDistanceWalked
        self.totalNumberOfWalks = totalNumberOfWalks
        self.totalTimeWalked = totalTimeWalked
        self.lastWalk = lastWalk
        self.firstWalk = firstWalk
        self.currentEvent = currentEvent
        self.daysSinceStart = daysSinceStart
        self.daysWalked = daysWalked
        self.save()

    def summary(self):
        return {
            "totalDistanceWalked": round(self.totalDistanceWalked, 2),
            "totalNumberOfWalks": self.totalNumberOfWalks,
            "totalTimeWalked": round(self.totalTimeWalked / 60000, 2),  # milliseconds to minutes
            "lastWalk": self.lastWalk,
            "firstWalk": self.firstWalk,
            "currentEvent": self.currentEvent,
            "daysSinceStart": self.daysSinceStart,
            "daysWalked": self.daysWalked,
        }
