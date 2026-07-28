"""
Business logic shared across views, ported from the FastAPI
services/availability.py and services/notifications.py modules.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model

from . import models

User = get_user_model()

SLOT_MINUTES = 30
NOTIFICATION_LIST_LIMIT = 50
AVAILABILITY_SUBMIT_WINDOW = timedelta(weeks=4)


def display_name(user):
    return user.get_full_name() or user.get_username()


def _slot_buckets(start, end):
    buckets = []
    cur = start.replace(second=0, microsecond=0)
    while cur < end:
        buckets.append(cur)
        cur += timedelta(minutes=SLOT_MINUTES)
    return buckets


def collate_availability(group_id, activity_id):
    """
    Collates availability slots across group members for a given activity,
    respecting interest levels:
      - definitely_interested: included, prioritized
      - sure_why_not: included, lower priority
      - definitely_not: excluded entirely
      - no opinion cast yet: excluded entirely
    """
    interest_map = dict(
        models.ActivityInterest.objects.filter(activity_id=activity_id).values_list("user_id", "level")
    )

    slots = models.AvailabilitySlot.objects.filter(group_id=group_id)

    di_buckets = {}
    swn_buckets = {}

    for slot in slots:
        level = interest_map.get(slot.user_id)
        if level == models.InterestLevel.DEFINITELY_NOT:
            continue
        for bucket in _slot_buckets(slot.start_time, slot.end_time):
            if level == models.InterestLevel.DEFINITELY_INTERESTED:
                di_buckets.setdefault(bucket, set()).add(slot.user_id)
            elif level == models.InterestLevel.SURE_WHY_NOT:
                swn_buckets.setdefault(bucket, set()).add(slot.user_id)
            # else: no opinion cast on this activity yet -- excluded entirely

    user_names = {}
    for bucket in list(di_buckets.values()) + list(swn_buckets.values()):
        for uid in bucket:
            if uid not in user_names:
                user = User.objects.filter(pk=uid).first()
                if user:
                    user_names[uid] = user.get_full_name() or user.get_username()

    all_buckets = sorted(set(di_buckets.keys()) | set(swn_buckets.keys()))
    result = []
    for bucket in all_buckets:
        di_users = list(di_buckets.get(bucket, set()))
        swn_users = list(swn_buckets.get(bucket, set()))
        result.append(
            {
                "start_time": bucket,
                "end_time": bucket + timedelta(minutes=SLOT_MINUTES),
                "definitely_interested_count": len(di_users),
                "sure_why_not_count": len(swn_users),
                "definitely_interested_users": [user_names.get(u, str(u)) for u in di_users],
                "sure_why_not_users": [user_names.get(u, str(u)) for u in swn_users],
            }
        )
    return result


def format_suggestion_message(display_name_str, activity_title, start_time, note=None):
    start_str = f"{start_time.strftime('%b')} {start_time.day} at {start_time.strftime('%I:%M %p').lstrip('0')}"
    msg = f'{display_name_str} suggested watching "{activity_title}" on {start_str}.'
    if note:
        msg += f" Note: {note}"
    return msg


def notify_group(group_id, message, exclude_user_id=None):
    """
    Notification dispatcher -- v1 sends in-app only.
    v2: add an SMS channel here without touching call sites (Twilio env vars
    were stubbed out, unused, in the original .env.example -- never implemented).
    """
    member_user_ids = models.GroupMember.objects.filter(group_id=group_id).values_list("user_id", flat=True)
    notifications = [
        models.Notification(user_id=uid, group_id=group_id, message=message)
        for uid in member_user_ids
        if uid != exclude_user_id
    ]
    models.Notification.objects.bulk_create(notifications)
