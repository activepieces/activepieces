# Active-user seat floor is enforced DB-authoritatively on the AP server

Status: accepted (supersedes an earlier two-layer / Autumn-usage-backstop design)

## Context

A platform may not have more **active** Users than its plan's seat limit (`usersLimit`). Two moments
need enforcing: (1) **adding/inviting** a user when already at the limit, and (2) **lowering** the limit
(plan downgrade, cancel-to-Free, or seat decrease) below the current active-user count.

The plan/seat catalog and billing live in Autumn (via `console.activepieces.com`, which holds the master
key). An earlier design tried to make the console an independent **backstop** — the AP server pushed the
active-user count into Autumn (`balances.update` / "setUsage") and the console re-read it to refuse
over-floor plan changes. That was abandoned:

- The customer-scoped key can't call `balances.update` (403), so the write had to be proxied through the
  console master key — adding a whole endpoint + client method purely to write a number back to Autumn.
- The console then read back the number **the AP server itself wrote**, so it wasn't an independent check
  at all — just a circular, eventually-consistent copy with a TOCTOU window.

## Decision

Enforce the floor in **one place: the AP server, against its own database.**

- **Adding/inviting** is gated by `checkUsersExceededLimit` — `countActiveByPlatformId` vs the projected
  `platform_plan.usersLimit` (throws `QUOTA_EXCEEDED` / metric `USERS`). Wired on invite and on
  reactivation (INACTIVE→ACTIVE).
- **Lowering** the limit is gated by `assertSeatsNotBelowActiveUsers` — same DB active-user count vs the
  target seat limit — on plan downgrade (`/checkout`), cancel-to-Free, and seat decrease.
- The UI is **proactive**: before a downgrade/decrease it opens a deactivate-users dialog so the admin
  frees seats first; the backend guard is the authoritative check.

`usersLimit` itself is projected from Autumn's `balance.granted` (included + purchased prepaid seats) — a
**read** that needs no usage push. No active-user *usage* is written to Autumn, and the console performs no
seat check.

## Consequences

- Single source of truth for enforcement (the AP DB). No `setUsage`, no console backstop, no freshness
  contract, no cross-service sync to keep aligned.
- The floor is enforced at **request time**. Seat **decreases currently take effect immediately** (Autumn
  `on_decrease: prorate` — the customer is credited the unused portion). This is an **interim** setting: the
  intended behavior is deferred-to-cycle-end with no refund, but a deferred decrease is invisible in the UI
  because Autumn's customer response does not yet expose the pending scheduled quantity. The interim makes the
  decrease land in the normal `balances.usersLimit` immediately, so the AP projection reflects it without any
  scheduled-state read. Revisit (flip back to deferred/no-refund) once Autumn ships the scheduled quantity in
  `getCustomer`. See the Billing feature doc.
- Because decreases apply immediately, the limit drops at request time alongside the floor guard, so the
  earlier "over cap at renewal" risk does not arise under this interim setting.
- Only the **owner** is undeletable; the deactivate-users dialog lists every other active User, so the
  target is always reachable.
