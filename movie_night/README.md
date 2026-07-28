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
- **Frontend**: A React (Vite) SPA. Source lives in `frontend_src/`; the
  built output is checked in under `assets_build/` and that's what Django
  actually serves — `templates/movie_night_app.html` is the built
  `index.html`, served for any non-API route under `/movie_night/`, with
  React Router (`basename="/movie_night"`) handling client-side routing from
  there. See "Building the frontend" below for how to go from a
  `frontend_src/` change to an updated `assets_build/`.

## Routes

All routes are mounted under `/movie_night/` (see `portfolio/urls.py`).

- `api/auth/register`, `api/auth/login`, `api/auth/logout`, `api/auth/me`
- `api/groups`, `api/groups/join`, `api/groups/invite/<invite_code>` (public
  preview), `api/groups/<id>`, `api/groups/<id>/members`
- `api/groups/<id>/activities`, `api/activities/<id>/interest`
- `api/groups/<id>/availability`, `api/groups/<id>/availability/me`,
  `api/groups/<id>/availability/<activity_id>`
- `api/groups/<id>/suggest`
- `api/notifications`, `api/notifications/<id>/read`, `api/notifications/read-all`
- everything else under `/movie_night/` falls through to the SPA

## Invite links

Every `Group` has an `invite_code`. The invite link flow is:

1. Frontend builds a link like `/movie_night/join/<invite_code>` (route is
   frontend-only; the backend doesn't know about that path shape).
2. On load, it can call `GET api/groups/invite/<invite_code>` (no auth
   required) to show "You've been invited to <name>".
3. If the visitor isn't logged in, send them to register/login, passing the
   invite code along as `invite_code` in the `RegisterSerializer`/
   `LoginSerializer` payload. Register/login will join them to the group
   automatically as part of that request.
4. If already logged in, `POST api/groups/join` with the invite code joins
   them directly.

## Building the frontend

`frontend_src/` is the Vite/React source; `assets_build/` is the built
output Django actually serves, and the two are checked in separately (no
build step runs at deploy time). Whenever you change anything in
`frontend_src/`, rebuild and copy the output over:

```
cd movie_night/frontend_src
npm install
npm run build
```

`vite.config.js`'s `outDir` is already set to `../assets_build`, so
`npm run build` writes straight into `movie_night/assets_build/` — no
manual copy needed. It also empties `assets_build/` first
(`emptyOutDir: true`), so don't hand-edit anything in there; changes will be
overwritten by the next build.

After building, run `python manage.py collectstatic` from the repo root so
the new hashed/renamed assets land under `collected_static/` for
production, then commit both `frontend_src/` (the source change) and
`assets_build/` (the rebuilt output) together.

For local iteration with hot reload instead of a full rebuild each time,
`npm run dev` runs a Vite dev server that proxies API calls to
`http://localhost:8000` (see the `server.proxy` block in
`vite.config.js`) — run `python manage.py runserver` alongside it.

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
