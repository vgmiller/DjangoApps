# TODO

- Add a "Forgot Password" flow (currently the only recovery path is a manual
  `manage.py changepassword` / DB reset by whoever has server access).
  Needs: a request-reset endpoint that emails a signed, expiring reset link
  (e.g. Django's `PasswordResetTokenGenerator` + an email backend), a
  frontend page to request it, and a frontend page to submit the new
  password with the token.

- Convert duplicate inline styles to better-practice CSS (many components
  hardcode the same hex values/style objects repeatedly instead of sharing
  classes or the `:root` custom-property palette in `index.css`).
