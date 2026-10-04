---
status: accepted
---

# Admin button clicks are one event with a control id

## Decision

Every clickable control in the platform admin reports through one event,
`platform.admin.control.clicked`, with `{ control, page }`. `control` is a literal from one
typed list and `page` is the route pattern. It records clicks only, copy buttons and external
links included, not whether the action then succeeded.

Ids are named `area.thing.action` (`pieces.install.open`, `projects.delete.confirm`,
`api-keys.value.copy`), so they survive a reworded or translated label. The action is one of
`open`, `submit`, `confirm`, `toggle`, `select`, `copy`, `link` or `run` (a button that acts
at once, such as Sync or Refresh). Cancel, Close and Back carry no id. A control opts in by
carrying a typed `adminControl(...)` id, and one click listener on the admin layout reports it.
Keeping new buttons covered is a convention for reviewers, not a failing test.

## Context

Decision `000045` gave the paywall surfaces five named events. The admin has some 190 more
controls (Install Piece, New Project, Invite, Delete, Save, toggles, copy, docs links). On
Cloud, autocapture is fenced to the auth funnel, so none of them reported anything beyond
`platform.admin.page.viewed`.

## Why

A named event per control costs an enum member, a unique label in the "Events we track"
dialog (the catalog test requires one per event) and a shared version bump, about 190 times.
One event keeps the disclosure dialog to a single plain-language line and makes a new
button a new literal.

Rejected: PostHog autocapture on `/platform/*`. It records element text, and admin tables
show emails and project, connection and key names, which breaks the no-names rule of
`000045`. It also only runs on Cloud.

## Consequences

Dashboards split by `control`, not by event name, and renaming a control starts a new series
rather than moving the old one. A submit click fires even when validation or the API fails,
so `*.submit` means attempted, not done. Billing, invites and plan changes already emit
server-side events, so web clicks there would double count outcomes. The paywall events from
`000045` stay as they are; never add them to this one when counting.

A Radix Select value choice carries no id. Radix selects on pointer-up and unmounts the item,
and sets `pointer-events: none` on the body while open, so a document click listener cannot
see the choice reliably. Tag a button or menu item instead, or report it from the select's
`onValueChange`.

The consent controls on Configurations (the Product analytics and Deployment setup switches and
its Save) carry no id. Turning analytics off would send a click at the moment of opting out, and
turning it on would be dropped because consent is not saved yet.
