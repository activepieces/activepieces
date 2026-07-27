---
status: accepted
---

# Approval links require a POST confirmation on a dedicated route

## Decision
Approval emails link to a dedicated `/:id/waitpoints/:waitpointId/confirm` route that serves an HTML confirmation page on GET/HEAD (never consuming the waitpoint), with Approve/Disapprove buttons; only the resulting POST resumes the flow. A single button replaces the two bare GET links across email, Telegram, Discord, and Teams, every channel whose buttons are browser `url:` links. The existing resume routes keep resuming on a bare GET, now marked `@deprecated`.

## Context
Paused flows resume via an unauthenticated, single-use endpoint whose only guard is an unguessable id (`flowRunId` + `waitpointId`). The approval pieces embedded two bare GET links in emails. Email security scanners (Microsoft Safe Links, Mimecast, Proofpoint) pre-fetch URLs with a GET before delivery, indistinguishable from a human click, so the prefetch consumed the waitpoint and could resume with an arbitrary outcome, while the human's later click saw "expired" (Pylon #5253, a regression since the 0.82.0 waitpoint rewrite).

## Why
A GET that never mutates is scanner-safe; only a deliberate POST decides the outcome. A new route is the surgical fix:

- Left the old routes untouched so already-delivered emails keep working, an accepted prefetch risk that ages out via the deprecation.
- Slack is excluded: its buttons POST server-side from Slack's webhook, so they are not browser-GET-prefetchable and gain nothing.
- Branding on the confirmation page resolves through a CE-safe `hooksFactory` theme hook, so CE controllers never import the EE helper.

## Consequences
New approval emails are scanner-safe: a prefetch renders the page but never resumes, and the human's single deliberate POST decides.

- The confirmation page reports only "already responded" (not which decision) when reopened after the fact, because the waitpoint is deleted on resume and the decision isn't persisted. Persisting it would need a schema change, deliberately out of scope.
- The clicker still sees their own Approved/Disapproved result on the immediate POST.
- The POST response is content-negotiated (HTML page vs `{ message }` JSON), so programmatic callers are unaffected.
