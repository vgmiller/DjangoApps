# Movie Night

Movie Night helps a group of friends pick what to watch together. Members create
a group, submit movies/shows to a shared watchlist, cast an interest level on
each ("definitely interested" / "sure, why not" / "definitely not"), and submit
their availability so the group can see when everyone is free to watch the
top picks.

This app was originally a standalone FastAPI service with its own JWT auth. It
has been rewritten as a Django app (this directory) so it can run inside the
DjangoApps portfolio project alongside the other apps, reusing Django's
built-in auth/session/admin instead of a parallel JWT stack. The frontend is
still a React SPA; only the backend changed.

## Architecture

- **Backend**: Django + Django REST Framework. Views are DRF `APIView`
  classes (`views.py`), backed by plain Django ORM models (`models.py`) and a
  small services module (`services.py`) for availability collation and
  in-app notifications.
- **Auth**: Django's session auth (`django.contrib.auth` + DRF
  `SessionAuthentication`), not JWTs. `Profile` extends the built-in `User`
  with a `phone_number` field rather than swapping in a custom user model.
- **Frontend**: A React SPA, pre-built and checked in under `assets_build/`.
  Django serves the built `index.html` (`templates/movie_night_app.html`) for
  any non-API route under `/movie_night/`, and React Router (with
  `basename="/movie_night"`) handles client-side routing from there. The
  frontend source is not part of this repo.

## Routes

All routes are mounted under `/movie_night/` (see `portfolio/urls.py`).

- `api/auth/register`, `api/auth/login`, `api/auth/logout`, `api/auth/me`
- `api/groups`, `api/groups/join`, `api/groups/<id>`, `api/groups/<id>/members`
- `api/groups/<id>/activities`, `api/activities/<id>/interest`
- `api/groups/<id>/availability`, `api/groups/<id>/availability/me`,
  `api/groups/<id>/availability/<activity_id>`
- `api/groups/<id>/suggest`
- `api/notifications`, `api/notifications/<id>/read`, `api/notifications/read-all`
- everything else under `/movie_night/` falls through to the SPA

## Data model

`Group` → `GroupMember` (owner/member) → `Activity` (watchlist item) →
`ActivityInterest` (per-user interest level) and `AvailabilitySlot`
(per-user free/busy windows), collated per-activity by
`services.collate_availability`. `Notification` is a simple in-app feed;
there is no email/SMS channel yet.

## Local development

This app has no standalone dev server — it runs as part of the main
`portfolio` Django project. From the repo root:

```
python manage.py migrate
python manage.py runserver
```

Then visit `/movie_night/`. Static assets are served from `assets_build/`
per the `STATICFILES_DIRS` entry in `portfolio/settings.py`; run
`python manage.py collectstatic` if you need them under `collected_static/`.
