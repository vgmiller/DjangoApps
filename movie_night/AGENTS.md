# Agent notes: movie_night

Context for any agent (or human) editing this app.

## This was ported from FastAPI to Django

The original implementation was a standalone FastAPI service with its own
JWT-based auth (`backend/app/auth.py` in the old codebase, not present here).
It has been fully rewritten as a Django app living in this directory of the
`DjangoApps` portfolio project. There is no FastAPI code left to reference —
`services.py` and `views.py` still mention the original in docstrings/comments
purely as design-decision context, not as something that still exists.

Key differences from the old service, and why:

- **Auth is Django sessions, not JWT.** The FastAPI app needed its own JWTs
  because it had no other session mechanism. This project already has
  `django.contrib.auth` + `SessionMiddleware` wired up for every other app
  (see naga, hobbits), so movie_night reuses that: `register`/`login` call
  Django's `authenticate()`/`login()`, and every other endpoint uses DRF's
  `SessionAuthentication` + `IsAuthenticated`. Don't reintroduce JWTs here.
- **User model is Django's built-in `User`, not a custom one.** The old
  service's user record (email/password/name) maps directly onto fields
  Django's `User` already provides. The one extra field, `phone_number`,
  lives on a `Profile` model (`OneToOneField` to `User`) instead of swapping
  in a custom user model, since a custom user model would ripple across the
  whole `portfolio` project, not just this app.
- **Notifications are in-app only.** `services.notify_group` only writes
  `Notification` rows. Twilio/SMS env vars existed in the old `.env.example`
  but were never implemented — don't assume an SMS path exists.

## Structure

- `models.py` — ORM models: `Group`, `GroupMember`, `Activity`,
  `ActivityInterest`, `AvailabilitySlot`, `Notification`, `Profile`.
- `views.py` — DRF `APIView` classes, one per endpoint, plus `app()` which
  serves the SPA shell for any non-API path.
- `serializers.py` — DRF serializers for request validation and response
  shaping.
- `services.py` — non-request-scoped logic: availability collation
  (`collate_availability`) and notification fan-out (`notify_group`).
- `urls.py` — API routes must stay above the SPA catch-all
  (`path("<path:path>", views.app, ...)`) since Django resolves patterns
  top-to-bottom; the catch-all would otherwise shadow every API route.
- `templates/movie_night_app.html` — the built SPA's `index.html`, served by
  Django's template engine (not a static file) so it can pick up
  `{% static %}` URLs for the hashed asset filenames.
- `frontend_src/` — the React (Vite) frontend source, checked in directly
  (`node_modules/` and `dist/` are gitignored, not the source itself). Build
  from here with `cd movie_night/frontend_src && npm install && npm run
  build`, then copy the build output into `assets_build/` (see below) and
  run `collectstatic`.
- `assets_build/` — pre-built React frontend output (JS/CSS/icons), checked
  in directly since Django serves it straight from here (no build step at
  deploy time). After changing `frontend_src/`, rebuild and copy the new
  `dist/` contents over this directory so the two stay in sync.

## Conventions to follow

- New endpoints should be DRF `APIView` subclasses using
  `SessionAuthentication` + `IsAuthenticated` (inherit from
  `MovieNightAPIView` in `views.py`) unless they're intentionally
  unauthenticated (register/login, like `RegisterView`/`LoginView`).
- Membership checks go through `_assert_member(group_id, user_id)` in
  `views.py` — every group-scoped endpoint should call it before touching
  group data.
- Keep business logic that isn't request-scoped (aggregation, fan-out) in
  `services.py` rather than inline in views, matching the existing split.
- Invite links: `RegisterSerializer`/`LoginSerializer` accept an optional
  `invite_code`; `_join_via_invite_code()` in `views.py` silently no-ops on
  an unknown code rather than erroring, since register/login must still
  succeed even if the invite was stale. `GroupInvitePreviewView` is the one
  intentionally public group endpoint besides register/login — it only
  exposes `{id, name}`, never membership or activity data.
- The invite-link frontend work (copy-link button, `/join/<code>` route,
  wiring `invite_code` into register/login calls) still needs to be built in
  `frontend_src/` — the backend support for it exists but nothing in the SPA
  calls it yet.
