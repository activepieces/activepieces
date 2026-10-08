---
status: accepted
---

# Account and sign-in telemetry is Cloud-only

## Decision

All thirteen account and auth events — `signed.up`, `signed.in`, the sign-up and
sign-in form events, federated login, captcha, email verification and the four
`email.code.*` — live in `CLOUD_ONLY_TELEMETRY_EVENTS` in `core/shared`, beside the
enum. `captureUserEvent` returns early on them off Cloud, the browser's `capture()`
does the same, and the Configurations dialog derives its hidden set from that one
constant rather than marking events by hand.

## Context

Eleven of the thirteen already could not fire on a self-hosted instance: the
passwordless module is registered only in the Cloud arm of `app.ts`,
`EMAIL_CODE_AUTH_ENABLED` is `edition === CLOUD && turnstile.isConfigured()`, CE and
EE auto-verify so no verification link is ever generated, and the pre-login funnel is
fenced to `cloud.activepieces.com`. But `signed.up` and `signed.in` did fire on CE and
EE, and the in-app dialog listed all thirteen as things a self-hoster sends. That
dialog is self-hosted-only — Cloud redirects away from the page — so it was disclosing
a funnel its only readers could never produce.

## Why

"An account event is a Cloud event" is one line to state and cannot drift. The
alternative — leaving the two backend events on and hand-marking the other eleven in
the web catalog — is exactly the arrangement that produced the wrong dialog in the
first place: two sources of truth, one of which nothing checks. Enforcing at
`captureUserEvent`, the choke point all four `telemetry()` entry points funnel
through, means a new call site cannot miss the guard. Rejected: gating per emit site
(four-plus places, drifts), and keeping `signed.up` for install counts (see below).

## Consequences

We lose the account *event stream* off Cloud — signup and sign-in timing, and any
funnel sequenced off them. We do not lose the census: `telemetry().identify` calls
PostHog directly and is deliberately **not** routed through `captureUserEvent`, so it
is untouched by this guard. A self-hosted signup still writes a person profile
carrying `activepiecesEdition`, `activepiecesVersion` and `firstSeenAt` — enough to
count and date CE and EE installs — and `pickTelemetryPii` keeps names and emails off
it. Edition also rides every remaining event, through `getMetadata()` on the server
and `posthog.register` in the browser.

That asymmetry is intentional, and is the thing to check before "consistency-fixing"
it: guarding `identify` as well would silently delete the only self-hosted install
signal we have.

Cloud signup reporting has no integration test. The only one lived in the CE suite and
asserted the behaviour this decision removes.
