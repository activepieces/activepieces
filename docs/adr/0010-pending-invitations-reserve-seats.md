# Pending invitations reserve seats, enforced at invite creation under a platform_plan row lock

Status: accepted (extends ADR-0009)

## Context

`usersLimit` was enforced counting **active** Users only, at invite-creation time. Because a `PENDING`
invitation consumes no seat until accepted, several invites sent while under the limit could all be
accepted past it — the limit was not a real ceiling (the "accept-time gap"). We want the seat limit to
hold, and we want the "out of seats" error to land on the **admin** (proactive), not the invitee.

## Decision

Adopt the **GitHub model: a pending invitation reserves a seat as soon as it is created**, and enforce
proactively at invite time.

- **`usedSeats = activeUsers + reservedInvites`.** `reservedInvites` = `COUNT(DISTINCT
  lower(email))` of non-expired `user_invitation` rows with `status IN (PENDING, ACCEPTED)` whose email does
  **not** already resolve to a platform user of **any status** (predicate identical to
  `wouldAddNewUser`). Both PLATFORM and PROJECT invites count (both create a platform User on
  accept). `ACCEPTED` rows are counted because an accepted invitation reserves a seat until the User is
  provisioned (and the row deleted) — this covers both the invitee-has-no-identity-yet case and the
  auto-accept path (see the API-key bypass consequence below). Expiry uses the single
  `INVITATION_EXPIRY_SECONDS` constant that also signs the invitation link, so link-expiry and
  count-expiry cannot drift; expired rows are excluded by `created > cutoff` (they are never deleted).
- **Enforced at invite creation and at reactivation** (INACTIVE→ACTIVE), skipping the check for
  seat-neutral invites (to an existing member). `entitled_seats` is read from the projected
  `platform_plan.usersLimit` — never a live Autumn call (the billing projection is pull-based).
- **Concurrency: a Postgres row lock.** The seat check + the write run in one transaction that takes
  `SELECT … FOR UPDATE` (`.setLock('pessimistic_write')`) on the platform's `platform_plan` row, so all
  seat-consuming writes for a platform serialize. Accepted alternatives were rejected: **reject-at-accept**
  (bounces the invitee instead of warning the admin); **RedLock** (adds a Redis dependency and a 200ms
  retry-poll latency under batch contention); a **bulk invite endpoint** (only justified as a RedLock
  workaround). The row lock blocks-and-wakes with no polling, needs no new dependency, and matches the
  in-repo precedent (`waitpoint-service.ts`).
- **The seat-lowering floor** (`assertSeatsNotBelowActiveUsers`, used on plan downgrade / cancel-to-Free /
  seat decrease) compares the target against `usedSeats` (active + reserved), not active alone. The
  deactivate-users dialog lets the admin free seats by deactivating users and/or revoking pending invites.
  Unlike the invite/reactivation paths, the floor is an **intentional lock-free read** — it takes no
  `FOR UPDATE`. These flows call Autumn's `attach` over the network, and holding the `platform_plan` row
  lock across that round-trip would serialize/block every invite for the platform until Autumn responds.
  A bounded transient overshoot (an invite landing between the floor read and the limit change) is
  acceptable: the invite path is the only hard ceiling and over-cap-after-downgrade is out of scope.

## Consequences

- The limit is a real ceiling for the **invite and reactivation paths**, including **API-key / auto-accept
  invites**: those write the row as `ACCEPTED` inside the locked transaction, and because `ACCEPTED` rows
  count as reserved, a concurrent second invite acquiring the lock sees the first and is blocked — closing
  the TOCTOU window where two simultaneous API-key invites at the seat boundary could both provision and
  overshoot. Normal invite-accept cannot overshoot either: the seat was already reserved at invite
  **creation**, and accept only materializes it. It is **not a global invariant**, though: SCIM and
  managed-authn (embedding) create Users with no seat check at all, so `usedSeats ≤ usersLimit` can still be
  exceeded through those paths — deliberately out of scope (separate ticket).
- `countActiveByPlatformId` is read outside the locked transaction's `entityManager` (only the
  invite-count half participates); safe under READ COMMITTED + the row lock for invite-vs-invite and
  invite-vs-reactivation, which is all the guard claims.
- A rare concurrent **duplicate-email** invite may be over-conservatively rejected (never over-permitted) —
  `additionalSeatsNeeded` is computed just before the lock; `DISTINCT` + the exclude-existing-user
  predicate make the 0-cases genuinely seat-neutral, so no overshoot is possible.
- **Billing is never overcharged by an overshoot:** Autumn is metered on active Users via a separate
  ACTIVE-only query (`billing-usage-report-service.ts`), independent of `usedSeats`.
- Stale (expired, never-accepted) `PENDING` rows linger (not deleted) and appear in the now seat-relevant
  invitations list; they stop counting after expiry via the `created > cutoff` filter.
