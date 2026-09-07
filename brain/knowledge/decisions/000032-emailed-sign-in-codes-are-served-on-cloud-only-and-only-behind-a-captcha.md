---
status: accepted
---

# Emailed sign-in codes are served on Cloud only, and only behind a captcha

## Decision
`/otp/request` and `/otp/verify` move out of `authentication.controller.ts` into their own `passwordlessAuthModule`,
registered inside the `ApEdition.CLOUD` arm of `app.ts` and only when `turnstile.isConfigured()`. Everywhere else the
two routes do not exist. `/complete-sign-up` deliberately **stays** in `authenticationModule` on every edition: it is
not part of the emailed-code surface, it is what finishes any ONBOARDING principal, and since #15083
`provisionOrOnboard` hands those out from `signUp`, `signInWithPassword` and `federatedAuthn` too. Moving it would
brick every in-flight onboarding session the moment a captcha key went missing. A missing captcha is logged and the module
registers nothing; it is not a boot failure. `ApFlagId.EMAIL_CODE_AUTH_ENABLED` carries the same pair of conditions so
the form the UI offers always matches what the server will answer.

This reverses the "reach is gated on SMTP, not on edition" call in
[000027](./000027-email-sign-in-is-a-typed-code-on-the-existing-otp-primitive.md); everything else in 000027 stands.

## Context
A six-digit code is 10^6 possibilities, and what keeps guessing it expensive is the captcha in front of the request
endpoint — the only unauthenticated pair here — not the per-credential attempt counter — five wrong guesses discards the code, and asking for another hands
out five more. Turnstile is opt-in and unset out of the box, so a self-hosted instance served both endpoints with
nothing in front of them. 0.88.2 through 0.88.4 shipped that way: `authenticationModule` is registered
unconditionally, and the UI offered the code card on any edition with SMTP configured.

## Why
Hardening a path self-hosters never asked for buys less than not serving it. An absent route is a stronger guarantee
than any limit inside one, and it needs no configuration to hold — which is what
`.claude/rules/self-hosting.md` asks of anything that would otherwise need a key nobody set.

The rejected alternative was to keep the routes everywhere and require the captcha, failing boot without keys. That
takes an operator's flows, webhooks and instance down to enforce one sign-in method, which is out of proportion to
what is being protected. Registering nothing gives the same property — the feature cannot run without a captcha —
and costs the operator only that method.

Stating the flag's condition in `flag.service.ts` rather than exporting it from the module is deliberate:
`passwordless-auth.service` imports `flagService`, so importing the module into the flag service closes an import
cycle.

## Consequences
- Removing the three routes is a **breaking change** for self-hosters on 0.88.2–0.88.4 who had SMTP configured — they
  were offered emailed codes and now are not. `docs/install/reference/breaking-changes.mdx` carries the entry.
- **On Community those accounts are locked out with no in-product way back.** `requestCode` gives a new identity a
  random password, and the only writer of a password is `enterpriseLocalAuthnService`, whose module `app.ts` registers
  in the Cloud and Enterprise arms only — so Community serves no forget-password route and nothing else can set one.
  The operator has to write a hash onto the `user_identity` row. Enterprise and Cloud recover through
  **Forgot password**.
- A Cloud environment without `AP_TURNSTILE_SITE_KEY` / `AP_TURNSTILE_SECRET_KEY` starts normally and simply does not
  offer emailed codes; the UI falls back to the password forms because the flag carries the same condition. Cloudflare
  publishes always-pass test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) for previews.
- Two plugins now register under the `/v1/authentication` prefix. Anything added to one is absent from the other,
  so a shared hook or decorator has to go on both.
- The `EMAIL_LOGIN` carve-out from the paid-edition send gate in `email-service.ts`, which 000027 added to give CE
  reach, is now unreachable. It is left in place rather than removed, so the primitive stays edition-neutral.
