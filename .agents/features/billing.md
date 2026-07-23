# Billing (Autumn)

## Summary
Per-platform billing and entitlements, powered by [Autumn](https://useautumn.com). Each platform is
an Autumn customer holding a customer-scoped API key; every instance (Cloud + self-hosted EE) calls
Autumn directly for entitlement reads, `track`, usage push, checkout, and top-ups. Reads are served
from the `platform_plan` projection cache (pull-based sync, never inline Autumn calls). CE is unbilled.
Feature flags, credits, and non-consumable limits (`projects`, `users`) are projected from the
customer's Autumn plan into `platform_plan`. Bootstrap/migration and any master-key operation are
proxied through `console.activepieces.com`.

Billable dimensions:
- **AI Credits** — consumable; charged per production run + AI step + chat message (+ tool calls).
  Top-up is **additive** via native Autumn auto-top-up only (`configureAutoTopUp`) — there is no manual consumable top-up seam.
- **Seats (`users`)** — non-consumable; a seat is consumed by an **active** User **or reserved by a
  non-expired invitation** (`PENDING`, or `ACCEPTED`-not-yet-provisioned) (GitHub model — `usedSeats =
  active + reserved invites`; counting `ACCEPTED` closes the API-key auto-accept bypass; see ADR-0010).
  On the **Team** plan, seats beyond the base allotment are a **paid prepaid add-on** ($25/user/mo). Top-up is
  **set-total** (`adjustUnconsumableFeatureQuantity`): both increase and decrease apply **immediately, prorated**
  (added seats charged now, removed seats credited) — see the interim note in Seat top-up rules. Projects
  will later ride the same non-consumable seam.
- **Projects (`teamProjects`)** — non-consumable limit; tracked/enforced, not yet self-serve toppable.
- **Active flows** — unlimited in the new plans; tracked only, not enforced, not toppable.

### Seat top-up rules (Team plan)
- Control adjusts **extra** seats; `usersLimit` = base + extras. Availability is **plan-driven** (the
  seat control shows iff the customer's **active subscription** carries a priced `usersLimit` prepaid item,
  derived from `BillingOverview.nonConsumableFeatures` + `includedSeats`/`additionalSeats`; empty while trialing). Team **v2** prices seats (`$25/mo`, or `$240/yr` on
  team_annual) and **includes 25 seats**, so paid extras start at seat 26. **Grandfathered customers on an
  older plan version (Team v1, `usersLimit.price: null`) have no priced seat item** — the control correctly
  hides for them, and they need a v1→v2 migration before they can buy seats (TBD).
- **Autumn call = `updateSubscription`** (`billing.update`), NOT `attach` — re-attaching the plan the
  customer is already on fails with `plan_already_attached`. Body: `{ planId, featureQuantities: [{ usersLimit,
  quantity: TOTAL }], recalculateBalances: { enabled: true }, redirectMode: 'if_required' }`; quantity is the
  **total** (included + extras). Increase = **billed immediately** (prorated); decrease = **also immediate,
  prorated** (customer credited the unused portion) — configured on the plan item's `on_decrease` in the Autumn
  dashboard. `redirectMode: 'if_required'` charges the card on file or returns a `paymentUrl` when payment is
  needed. After an immediate change the AP controller calls `refreshEntitlements` so the projection +
  billing-overview cache update at once.
  - **INTERIM (why immediate, not deferred):** the intended design is *deferred to end of cycle, no refund*
    (keep paid seats till renewal). That path is parked because a deferred decrease is **invisible in the UI** —
    Autumn's `getCustomer` does not yet expose the pending scheduled quantity, so `updateSubscription` +
    `feature_quantities` gives no readable "will drop to N on {date}" state (verified: `attach` on the same plan
    → `plan_already_attached`; `createSchedule` works but strips other entitlements from the scheduled phase).
    Per the Autumn team: keep `billing.update`, and they will expose the scheduled limit change in `getCustomer`
    later. Until then `on_decrease` is set to **prorate (immediate + refund)** so the change lands in the normal
    balance and the projection reflects it. Flip back to deferred/no-refund once Autumn ships the field. See ADR-0009.
- **Enforcement is DB-authoritative (on the AP server), against `usedSeats` = active + reserved pending
  invites** (`countUsedSeats` in `platform-plan.service.ts`: `countActiveByPlatformId` + `COUNT(DISTINCT
  lower(email))` of PENDING, non-expired invites whose email isn't already a platform user of any status —
  the `wouldAddNewUser` predicate). Projected `usersLimit` (never a live Autumn call). Throws
  `ErrorCode.QUOTA_EXCEEDED` (metric `USERS`). See ADR-0010.
  - **Adding/inviting + reactivation** → `checkUsersExceededLimit` (`usedSeats + additionalSeatsNeeded >
    min(usersLimit, scheduledUsersLimit)` — the scheduled term binds only while a plan change is scheduled,
    ADR-0013), run **inside a `transaction` that takes `SELECT … FOR UPDATE` (`pessimistic_write`) on the
    platform's `platform_plan` row**, so the check + the invite/reactivation write are atomic and all
    seat-consuming writes for a platform serialize (closes the concurrent-invite race; no RedLock, no bulk
    endpoint). Seat-neutral invites (to an existing member) skip the lock. `finalizeInvitation` (SMTP/JWT)
    runs after commit, outside the lock.
  - **Lowering** the limit (plan downgrade `/checkout`, cancel-to-Free, seat decrease) →
    `assertSeatsNotBelowActiveUsers`, now comparing the target against `usedSeats`. See ADR-0009 (floor) +
    ADR-0010 (reservation) and the [Active-user floor](../contexts/platform/CONTEXT.md) term.
  - **NOT guarded** (create a User without a seat check — out of scope): invite-**accept**, SCIM,
    managed-authn (embedding). So the limit is an invite/reactivation-path guarantee, not a global invariant.
- **Deactivation flow (EE + Cloud), proactive UI**: before a downgrade/decrease the UI compares `usedSeats`
  to the target and, if over, opens the **deactivate-users dialog** — which lists **active Users (except the
  owner)** AND a **Pending invitations** section, each revocable. `seatsAfter = currentUsers − deactivated −
  revoked`; the confirm button is disabled until `seatsAfter ≤ target`. On confirm it deactivates the selected
  users (`platformUserApi.update`) and revokes the selected invites (`userInvitationApi.delete`) in parallel,
  invalidates the users + invitations caches, then auto-fires the change. Owner-only protection ⇒ target
  reachable. **Edge caveats (v1):** the invite list is `usePlatformInvitations` (PLATFORM type only, no status
  filter, no expiry/dedup), so its per-row "frees one seat" can diverge from the backend `countUsedSeats`
  (which is DISTINCT-email, non-expired, and also counts PROJECT invites) — a downgrade could still be
  backend-rejected if the divergence matters. Acceptable for the common case; tighten later.
- **`usersLimit` projection needs no usage push** — it maps from Autumn `balance.granted` (included + purchased
  prepaid). Toppability is derived from the customer's **actual active subscription** plan items
  (version-accurate), and is empty while trialing.
- **Over-cap at renewal**: for *seat decreases* it does not arise under the current interim (immediate
  decreases drop the limit at request time, alongside the floor guard; would return if `on_decrease` flips
  back to deferred — out of scope / TBD). For **scheduled plan changes** (paid→paid downgrade, cancel-to-Free
  — which apply at period end) it is closed by the **Scheduled seat cap** (ADR-0013): the projection sync
  derives `scheduledUsersLimit` on `platform_plan` from the Autumn customer's **scheduled base subscription**
  (cancel-to-Free included — Autumn schedules the auto-enable Free plan; verified in sandbox), and
  `checkUsersExceededLimit` enforces `min(usersLimit, scheduledUsersLimit)`. Derived-not-set: self-heals for
  out-of-band downgrades (Stripe portal) via the post-cancel/reactivate `refreshEntitlements` + the 15-min
  lazy pull sync, and clears itself on reactivation or when the switch applies. UX: out-of-seats dialog
  branches on overview state (`cancelAt`/`scheduledPlanName`) with a "Keep current plan" remediation, the
  Users card shows the effective cap as the headline total with a downgrade note (the Plan/Additional
  breakdown is hidden while the cap binds), and the manage-seats control is hidden while a schedule exists
  (purchased extras cannot lift the cap). The hide is also enforced server-side: console
  `setUnconsumableQuantity` throws 409 CONFLICT on `usersLimit` changes while a cancel or a downgrade to a
  plan without a priced seat item is scheduled (`assertSeatsAdjustableWithSchedule`); a scheduled plan that
  itself sells seats (e.g. team→team_annual) stays adjustable. Non-seat features are not gated. **Purchased extra seats are refunded at downgrade initiation —
  console-side** so every API caller gets it, not just AP-initiated downgrades: `refundPurchasedSeats`
  (console `billing-service.ts`) reads the customer's `usersLimit` balance breakdown (extras = summed
  `prepaidGrant`), and if extras exist sets the quantity back to `includedSeats` (immediate prorated credit
  via `on_decrease`) — before `cancel`, and before a seat-lowering `checkout` attach (target plan's seat
  item `included` < current included + extras) — fairness pairing with the cap (customer can't use the
  extras during the window, so they shouldn't pay for them). Fail-open: refund errors are logged, never
  block the downgrade. Reactivating ("Keep current plan") does NOT restore extras — the admin re-buys if
  needed. The AP downgrade confirmations surface it ("Your {n} additional seats will be removed and the
  unused time credited back", `planSelectorUtils.dropToFreeWarning`).
- **Accept-time seat gap — CLOSED** by seat reservation (ADR-0010): a `PENDING` invite now reserves a seat at
  **creation** (counted in `usedSeats`), so invites can no longer be created past the limit and then all
  accepted past it. Accept is net-zero (pending −1, active +1). Remaining unguarded creators (SCIM,
  managed-authn) are noted above and out of scope.

## Billing page UI (seats)
The billing page (`app/routes/platform/billing/index.tsx`) shows a **Users** `BillingSection`
directly **under the Credits section**, mirroring the Credits layout: a seat-count card (used vs
`usersLimit`, progress bar) plus a "Manage seats" control (set total extra seats, priced from the
overview's `nonConsumableFeatures`, guarded by the active-user floor with a link to Platform → Users). The section is
gated on the overview carrying a priced `usersLimit` item (`BillingOverview.nonConsumableFeatures` +
`includedSeats`/`additionalSeats` — plan-driven: any plan version that prices a
`usersLimit` prepaid item, and not trialing). The action calls the `useUnconsumableProductTopup` hook
(`hooks/billing-hooks.ts`) → `adjustUnconsumableFeatureQuantity` seam.

## Key Files
- `packages/server/api/src/app/ee/platform/platform-plan/platform-plan.service.ts` — limit enforcement (`checkUsersExceededLimit`), credential accessors
- `packages/server/api/src/app/ee/platform/platform-plan/billing-providers/autumn-billing.ts` — EE `BillingProvider` impl (`adjustUnconsumableFeatureQuantity` seat change, overview, entitlement projection)
- `packages/server/api/src/app/ee/platform/platform-plan/billing-providers/autumn-utils.ts` — console client, projection (`mapAutumnFeaturesToPlatformPlan`), overview feature lists (`consumableFeatures`/`nonConsumableFeatures`)
- `packages/server/api/src/app/ee/platform/platform-plan/platform-plan.controller.ts` — billing routes (checkout, top-ups, portal)
- `packages/core/shared/src/lib/ee/billing/index.ts` — plan constants, top-up/checkout schemas
- `packages/core/shared/src/lib/management/platform/platform.model.ts` — `AutumnFeatureId`, `ToppableFeature`, `AutoTopUpConfig`, `usersLimit`
- `packages/web/src/features/billing/` — subscription info, AI-credit usage, top-up dialogs; seat control: `components/feature-usage/users-card.tsx`, `components/feature-usage/manage-seats-dialog.tsx`, `useUnconsumableProductTopup` hook, Users `BillingSection` in `app/routes/platform/billing/index.tsx`
- Seat seam: `platform/billing-provider.ts` (`adjustUnconsumableFeatureQuantity`, `checkUsersExceededLimit` on the CE/EE seam), `ee/.../platform-plan.service.ts` (`assertSeatsNotBelowActiveUsers` on downgrade + cancel + seat-decrease; `checkUsersExceededLimit`), `user-service.ts` (`countActiveByPlatformId`, reactivation guard), controller `POST /v1/platform-billing/unconsumable-feature-quantity` (refreshes entitlements when the change applies immediately), console `POST /api/v1/billing/unconsumable-feature-quantity` → `updateSubscription`
- Downgrade/seat-decrease deactivation flow: `packages/web/src/features/billing/components/feature-usage/deactivate-users-dialog.tsx` (proactive trigger from `plan-selector.tsx` — paid downgrade + drop-to-Free — and `manage-seats-dialog.tsx`, whose hard floor clamp is replaced by this flow); reuses the platform users list query + `platformUserApi.update`. Target included seats surfaced via new `PurchasablePlan.includedSeats` (`packages/core/shared/src/lib/ee/billing/index.ts`, populated by the console catalog mapper).
- Global error routing: `packages/web/src/app/query-client.ts` `MutationCache.onError` now defers to a mutation's own `onError` (so `QUOTA_EXCEEDED` is remediated per call site — add-seats vs deactivate — instead of always force-opening the upgrade dialog).
- Seat reservation (ADR-0010): `platform-plan.service.ts` (`countUsedSeats` = active + reserved pending; `checkUsersExceededLimit` takes the `platform_plan` `FOR UPDATE` lock + `additionalSeatsNeeded`; `assertSeatsNotBelowActiveUsers` uses `countUsedSeats`); `user-invitation.service.ts` (`INVITATION_EXPIRY_SECONDS` shared constant, `getInvitationExpiryCutoff`, `countAdditionalSeatsNeeded`, `wouldAddNewUser`, `createInvitationRecord`/`finalizeInvitation` split so SMTP/JWT run outside the lock); `user-invitation.module.ts` (invite endpoint wraps seat-check + create in one `transaction`); `user-service.ts` (reactivation wraps check + status-flip in the same locked transaction); `platform/billing-provider.ts` (`checkUsersExceededLimit({ platformId, entityManager })` seam); `platform.model.ts` (`PlatformUsage.activeUsers` + `invitedSeats`). Frontend: `users-card.tsx` (active/invited breakdown), `out-of-seats-dialog.tsx` (breakdown copy + Manage-invitations link to `/platform/users`), `deactivate-users-dialog.tsx` (pending-invites revoke section via `usePlatformInvitations` + `userInvitationApi.delete`), seat-count invalidation in `platform-user-hooks.ts` `useUpdateUserStatus`.
- Console (`/home/abdul/work/console`) `packages/server/api/src/app/modules/billing/` — bootstrap, migrate, checkout, `unconsumable-feature-quantity` (→ `autumn-client.updateSubscriptionQuantity`), overview feature lists (`consumableFeatures`/`nonConsumableFeatures`, version-accurate, trial-gated via `getBaseSubscriptions`), `auto-topup` (merges existing rules), master-key ops. **No seat-usage push / no console-side seat check** — enforcement is AP DB-authoritative (ADR-0009).

## Edition Availability
Enterprise (self-hosted, licensed) and Cloud. Community is unbilled (`OPEN_SOURCE_PLAN`, no-op provider).
Seat top-ups are Cloud self-serve on the Team plan (plan-driven, so any plan carrying a `users` prepaid item).

## Domain Terms
[Seat](../contexts/platform/CONTEXT.md), [Top-up](../contexts/platform/CONTEXT.md),
[Active-user floor](../contexts/platform/CONTEXT.md), [Scheduled seat cap](../contexts/platform/CONTEXT.md),
[PlatformPlan](../contexts/platform/CONTEXT.md), [AI Credit](../contexts/ai/CONTEXT.md),
[Edition](../contexts/platform/CONTEXT.md).
