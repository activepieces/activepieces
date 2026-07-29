---
status: accepted
---

# Pending invitations reserve seats, enforced at invite creation under a platform_plan row lock


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
  count-expiry cannot drift; expired rows are excluded by `updated > cutoff` (they are never deleted).
- **The expiry filter is `updated`, not `created`.** A resend goes through `createInvitationRecord`'s
  upsert, which reissues the link with a fresh 7-day JWT but leaves `created` on the original date.
  Filtering on `created` let the reservation lapse while the emailed link still worked — the exact drift
  this decision forbids — so a resend at the seat boundary passed its check, immediately stopped
  reserving, let another invite take the last seat, and still provisioned an ACTIVE user. TypeORM appends
  `"updated" = DEFAULT` to the `ON CONFLICT DO UPDATE SET` for `isUpdateDate` columns, so the resend
  already moves `updated` with no extra write. `updated` therefore means "when was the currently-valid
  link issued", which is what the reservation window is actually about.
- **Enforced at invite creation and at reactivation** (INACTIVE→ACTIVE). `entitled_seats` is read from the
  projected `platform_plan.usersLimit` — never a live Autumn call (the billing projection is pull-based).
- **A seat-neutral operation skips the cap check entirely** — `checkUsersExceededLimit` returns early on
  `additionalSeatsNeeded === 0` rather than evaluating `usedSeats + 0 > usersLimit`. `countAdditionalSeatsNeeded`
  returns 0 in exactly two cases, and in both the seat is *already* inside `usedSeats`:
  (1) the email resolves to an existing platform user (`wouldAddNewUser` false) — e.g. adding a current
  member to a second project; (2) a non-expired `PENDING`/`ACCEPTED` invitation for that email already
  holds the seat — i.e. a resend.
  Comparing instead of skipping made both operations fail with 402 whenever `usedSeats >= usersLimit`, even
  though neither adds a person. Being at or over cap is a legitimate steady state (decision 000017:
  a scheduled downgrade caps seats immediately while existing users stay), so an admin could not re-send
  an invitation email for a seat they were already paying for. Only the invite endpoint passes a computed
  value; the reactivation path uses the default of 1 and is unaffected.
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
  invitations list; they stop counting after expiry via the `updated > cutoff` filter.
- **Accepting an invitation extends its reservation window** — `accept()` writes `status = ACCEPTED`, which
  bumps `updated`, so the seat is held for another `INVITATION_EXPIRY_SECONDS` from the accept without a new
  link being issued. This drifts the other way (reservation outlives the JWT), which is the safe direction:
  it over-reserves (blocks an invite) rather than over-provisioning past a paid cap, and holding a seat for
  someone who has accepted is the intended behaviour anyway.
- **Tests that age an invitation must backdate `updated`, not just `created`.** A raw
  `UPDATE user_invitation SET created = …` bumps `updated` to now as a side effect, so it makes the row look
  *fresh* to the reservation queries. `seedInvitation` in `seat-reservation.test.ts` sets both.
- Still open: provisioning an accepted invitation performs no seat check of its own, so an accept followed by
  a much later signup can still land past the cap once the window lapses. The reservation and provisioning
  predicates disagree; tracked separately.
