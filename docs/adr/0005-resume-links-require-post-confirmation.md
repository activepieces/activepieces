# Approval emails link to a POST confirmation page on a dedicated route

## Status

accepted

## Context

Paused flows resume via an unauthenticated, single-use HTTP endpoint whose only
access control is an unguessable `flowRunId` + `waitpointId`
(`/api/v1/flow-runs/:id/waitpoints/:waitpointId`). The approval pieces embedded
two bare `GET` links in an email (`?action=approve` / `?action=disapprove`).

The first resume signal deletes the waitpoint and resumes; any later signal is
stale and returns "This link has expired." Email security scanners (Microsoft
Safe Links, Mimecast, Proofpoint) pre-fetch URLs with a `GET` before delivery.
That prefetch is indistinguishable from a human click, so it consumes the
waitpoint — and because both links are prefetched, it can resume with an
arbitrary outcome. The human's later click lands on the stale second `GET` and
sees "expired" even though the flow already resumed (Pylon #5253; a regression
since the 0.82.0 waitpoint rewrite).

Constraints that shaped the decision:
- **Already-delivered emails must keep working.** Links in inboxes point at the
  existing route and resume on `GET`; changing that route's behavior would break
  them.
- The waitpoint row is deleted on resume (the `(flowRunId, stepName)` unique
  index means a lingering row would block re-pausing the same step), so the past
  approve/disapprove decision is not recoverable after the fact.

## Decision

Introduce a **dedicated confirmation route** and leave the existing resume routes
untouched:

- **Existing routes** (`/:id/waitpoints/:waitpointId`, V0 `/:id/requests/:requestId`)
  keep resuming on a bare `GET`, now marked `@deprecated`. This preserves
  already-sent approval emails. They carry the known scanner-prefetch weakness;
  that is an accepted cost of backward compatibility.
- **New route** `/:id/waitpoints/:waitpointId/confirm`: a `GET`/`HEAD` never
  consumes the waitpoint — it serves a **Resume Confirmation Page** (a
  white-labeled HTML page with Approve/Disapprove buttons the human must click).
  Only the resulting `POST` consumes the waitpoint. On open, the page reads the
  waitpoint from the DB and, if the run has already moved on, shows an "already
  responded" state instead of consuming or erroring.
- The `POST` response is content-negotiated: `Accept: text/html` → a branded HTML
  result page; otherwise → the existing `{ message }` JSON, so programmatic
  callers are unaffected.
- **Approval messages now send a single button** linking to the `/confirm`
  page (`${waitpoint.resumeUrl}/confirm`), replacing the two bare links, across
  every channel whose buttons are **browser `url:` links** — email (Gmail,
  Outlook), Telegram, Discord, and Microsoft Teams. Channel-specific context the
  resumed piece needs (e.g. Telegram's `chat_id`, Slack's `channel`/`messageTs`)
  is appended to the `/confirm` URL and preserved through to the resuming `POST`.
  **Slack is intentionally excluded:** its buttons are interactive Slack
  components (`action_id`/`value`) that resume via a **server-side `POST`** from
  Slack's webhook to the app, so they are not browser-GET-prefetchable and gain
  nothing from a web confirmation page.

Page branding is resolved through a CE-safe `hooksFactory` theme hook
(`resume-page-hooks.ts`): CE returns `defaultTheme`; EE/Cloud `.set()` it to
`appearanceHelper.getTheme`, so the controller (CE code) never imports the EE
helper directly.

## Consequences

New approval emails are scanner-safe: a prefetch renders the confirmation page
but never resumes, and the human's single deliberate `POST` decides the outcome.
Old emails keep their prior (prefetch-vulnerable) behavior on the deprecated
routes — acceptable because those links already exist and will age out; the
deprecation marks them for eventual removal once no paused runs reference them.

The confirmation page reports only "already responded" (not which decision was
made) when reopened after the fact, because the waitpoint is deleted on resume
and the decision is not persisted; persisting it would require a schema change
and is deliberately out of scope. The person who clicks still sees their specific
Approved/Disapproved result on the immediate `POST` response.

The `/confirm` route recognizes the `approve`/`disapprove` query-param convention
shared with the approval pieces (to render the two buttons); a future reader will
otherwise wonder why a generic waitpoint route knows those labels — the coupling
is deliberate and minimal.
