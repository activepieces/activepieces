# Scheduled downgrades cap seats immediately at the target plan's allotment

Status: accepted

## Context

Plan downgrades and cancel-to-Free do not apply immediately — Autumn schedules them for the end of
the billing period. The active-user floor (ADR-0009) makes the admin deactivate down to the target
plan's seats **at initiation**, but nothing stopped them from re-activating users or inviting new
ones during the weeks until the switch lands — arriving at cycle end over the new plan's cap. (Seat
*decreases* don't have this window: they apply immediately/prorated. Scheduled *plan changes* do.)

## Decision

While a plan change is scheduled, seat-consuming operations (invite, reactivation) enforce
`min(usersLimit, scheduledUsersLimit)` — the **scheduled seat cap**.

`scheduledUsersLimit` is **derived from Autumn customer state inside the existing projection sync**
(`refreshEntitlements`): the scheduled base subscription's plan carries a `usersLimit` item, and
cancel-to-Free is covered by the same path because Autumn schedules the auto-enable Free plan as a
`scheduled` subscription (verified in sandbox). It is **not** written at downgrade initiation — a
derived value self-heals for out-of-band downgrades (Stripe portal, Autumn dashboard, support ops)
and clears itself when the schedule is reactivated away or applies, riding the existing refresh
triggers (post-cancel/reactivate refresh + 15-minute lazy pull sync).

UX: the out-of-seats dialog branches on billing-overview state (`cancelAt`/`scheduledPlanName`)
to show downgrade-specific copy with a "Keep current plan" remediation; the Users card shows the
pending cap ("Drops to {n} seats on {date}"); the manage-seats control is hidden while a schedule
exists (purchased extras could not lift the cap).

## Considered options

- **Persist at initiation, clear on reactivate/switch** — simpler to trace, but silently misses
  out-of-band downgrades and any missed clear-path leaves a stale cap blocking legitimate seat use.
- **Allow + warn (grandfather over-cap at switch)** — honors seats the customer is still paying
  for, but reopens the exact gap: at switch time you're back to silent over-cap or forced
  deactivation at a moment nobody is watching.
- **Cap new invites only** — reactivation was precisely the loophole; splitting the rule adds
  explanation burden without closing it.

## Consequences

A customer still paying for their current seats until period end cannot re-activate past the
scheduled cap — deliberate: they committed to the smaller plan in the deactivation dialog, can
still swap users within the cap, and can lift it instantly via "Keep current plan". SCIM and
managed-authn user creation remain unguarded, consistent with ADR-0010's scope.

Because the cap makes purchased extra seats unusable for the remainder of the period, downgrade
initiation also removes them with an immediate prorated credit (set-total back to the included
allotment, riding the existing `on_decrease: prorate` config) — fail-open, and not restored on
reactivation. This lives **console-side** (in the `/billing/cancel` and `/billing/checkout`
handlers), not in AP: it is pure entitlement/money orchestration needing no AP-DB knowledge, and
console placement covers downgrades initiated by any API caller. The split mirrors ADR-0009:
user-count-dependent guards stay AP-side (DB-authoritative); billing mutations stay console-side.
