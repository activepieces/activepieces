---
id: signing-in-with-an-emailed-code-is-now-offered-on
title: "Signing in with an emailed code is now offered on Activepieces Cloud only"
added: '2026-09-01'
release: 0.90.0
---

`POST /v1/authentication/otp/request` and `POST /v1/authentication/otp/verify` are no longer served on a self-hosted
instance. They return `404`, and the sign-in card no longer offers the "email me a code" step — it opens on the
password form instead. Versions 0.88.2 through 0.89.0 did serve them on any edition with SMTP configured.
`POST /v1/authentication/complete-sign-up` is unaffected and still served everywhere.

A six-digit code is a million possibilities, so what keeps guessing it expensive is the captcha in front of the
request endpoint. Cloudflare Turnstile is opt-in and unset out of the box, so a self-hosted instance served both
endpoints with nothing in front of them. Rather than require a Cloudflare account to make a sign-in method safe,
that method is no longer served where the captcha is not there.

On Cloud the same rule now applies: the routes exist only when both `AP_TURNSTILE_SITE_KEY` and
`AP_TURNSTILE_SECRET_KEY` are set. Without them the instance starts normally and simply does not offer emailed
codes. Activepieces Cloud has both configured, so nothing changes for it — the code step stays on the sign-in card
and accounts that use it keep signing in exactly as before.

#### What you need to do

Nothing, if your users sign in with a password or with Google — those paths are unchanged, and so are `/sign-up`,
`/sign-in` and `/switch-platform`.

**If you ran 0.88.2–0.89.0 with SMTP configured, assume some accounts were created through the code flow.** Those
accounts hold a random password nobody was ever shown, so removing the code flow removes the only way they could
sign in. There is no reliable marker for them in the database — a verified code deletes its `otp` row — so treat any
`EMAIL`-provider account whose owner cannot recall setting a password as one of them.

On **Enterprise**, send those users through **Forgot password** once to set a password; that flow needs the same SMTP
you already have configured.

On **Community** there is no way back in the product. Password reset lives in the enterprise module, which Community
does not register, so `POST /v1/authn/local/reset-password` is not served — and nothing else writes a password on any
edition, as there is no change-password endpoint. Do not be misled by the first half of that flow appearing to work:
`POST /v1/otp` **is** served on Community and answers `204`, but Community sends no OTP email of any type except a
login code, so no reset mail ever arrives. Set a password for each affected account directly —
`UPDATE user_identity SET password = '<bcrypt hash>' WHERE email = '…'` — and hand it to its owner over a channel you
trust, since they cannot change it themselves afterwards. Do this **before** you upgrade if you can, so nobody is
locked out in between.

If you script or test the sign-in page, note that the emailed-code step is gone and the two endpoints above
answer `404`.
