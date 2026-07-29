# movie_night — best-practice TODO

Each item is independent and can be picked up separately.

1. **No automated test coverage** — there is no `tests.py`/`tests/` package anywhere in the
   app. Every view, serializer, and service function has zero test coverage.

2. **`AvailabilitySlot` doesn't enforce `end_time > start_time` at the model level** — the
   invariant is only checked ad hoc in `AvailabilitySubmitView.post` (views.py), which silently
   drops invalid rows. Any other code path that creates an `AvailabilitySlot` (admin, shell,
   a future view) won't get this protection. Add a `CheckConstraint` on the model so it's a
   database-level guarantee instead.

3. **`Group.save()` has a TOCTOU race on `invite_code` uniqueness** (models.py) — it checks
   `Group.objects.filter(invite_code=...).exists()` in a loop, then calls `super().save()`.
   If two `Group` rows are created concurrently and land on the same generated code, the
   second `save()` can still raise an uncaught `IntegrityError` from the DB-level unique
   constraint, which `GroupListCreateView.post` doesn't catch, resulting in a 500 instead of
   a clean retry. Consider catching `IntegrityError` around the save and regenerating, or
   wrapping in a retry loop at the DB level.

4. **`Profile.phone_number` has no format validation** (models.py) — any string up to 32
   chars is accepted. `services.notify_group`'s own comment mentions a stubbed-out future SMS
   channel; if that's ever built, phone numbers stored today may not be usable without a
   validator (e.g. E.164 format) added retroactively.

