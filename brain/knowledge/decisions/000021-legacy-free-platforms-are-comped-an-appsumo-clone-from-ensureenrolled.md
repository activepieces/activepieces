---
status: accepted
---

# Legacy free platforms are comped an AppSumo clone from inside ensureEnrolled

## Context

Cloud platforms that were on the free tier before 30 July 2026 are mostly from before the Autumn
billing migration, whose catalog went live 23 July 2026. Pre-Autumn the Cloud free tier was `plan = 'standard'`
(`STANDARD_CLOUD_PLAN`): 200 credits a month, 10 active flows, 1 team project, `showPoweredBy: false`,
`apiKeysEnabled: false`. The Autumn `free` plan they were auto-enrolled onto is more generous on
credits (100 a day) and active flows (unlimited), but takes away the one team project
(`teamProjectsLimit` 0) and puts Activepieces branding back on their embeds (`showPoweredBy` true).

They need grandfathering, and the grant has to reach platforms that have been dormant since the
migration as well as active ones.

## Decision

**A new Autumn plan `free_legacy`, a verbatim clone of `appsumo` under a different name.** Unlimited
`apCredits`, 200 a month `appSumoAiCredits`, unlimited active flows, 1 user, 1 team project, plus
AppSumo's flags. AP's AppSumo metering extends to cover it.

**The console endpoint takes an Autumn customer id and nothing else.**
`POST /api/v1/billing/free-legacy`, gated by `apiKeyAuthHook` (`API_SECRET_KEY`), body
`{ autumnCustomerId }`. It never provisions a customer or mints a key, because AP always enrols first,
so the customer already exists by the time it is called. Mechanically it is
`billingService.appsumo()`: `attach({ comp: true })` then `setPlan`.

**The console re-checks eligibility against live Autumn before comping**, and refuses when the
customer's current base plan is not `free`. It must not read `autumn_customers.plan` for this:
`checkout()` and `cancel()` never call `setPlan`, so that column is stale for any self-serve customer
who upgraded, and guarding on it would comp a paying customer.

**AP decides who is eligible, from `ensureEnrolled`.** `getAutumnCredentials` widens to return `plan`
and `created` alongside the credentials. The flow is enrol-first, then check:

1. No credentials: enrol as today, which writes credentials and refreshes entitlements.
2. Then, on the refreshed row, comp `free_legacy` when `plan` is `free` and
   `platform_plan.created` is before 30 July 2026.

The check runs **even when credentials already exist**, so the early return on a non-nil
`autumnCustomerId` no longer short-circuits it.

**`ensureEnrolled` alone does not reach the cohort, so the comp also hangs off the lazy sync.**
`triggerLazyBillingProviderSync` only calls `ensureEnrolled` when `autumnCustomerId` is nil; an
already-enrolled platform takes the `refreshEntitlements` branch, and `POST /platform-billing/refresh`
goes straight to `refreshEntitlements` too. So on `ensureEnrolled` alone the comp would fire only for
the six billing *mutations* (checkout, seat change, auto top-up, setup payment, cancel, reactivate),
which inverts the intent: the cohort is passive free users, and the ones who would get comped are the
ones actively transacting.

The enrolled branch therefore also fires the comp, gated so it costs nothing when it cannot apply:

- **The predicate runs in memory on the row the caller already loaded.** `getOrCreateForPlatform`
  reads the `platform_plan` row and previously passed only `autumnCustomerId` along; it now passes
  `plan` and `created` too, so `isFreeLegacyEligible` is one string comparison and one date
  comparison. An ineligible platform costs **no DB read and no Redis read**, which matters because
  this runs on every plan read.
- **An eligible platform gets at most one attempt per `FREE_LEGACY_COMP_ATTEMPT_TTL_SECONDS`**
  (5 min) via `runOnceWithin` on `getFreeLegacyCompAttemptKey`. Without that claim a console outage
  would mean a distributed lock plus a 30s console call on every page load for every eligible
  platform. The claim bounds the retry cadence; it is not what makes the comp once-only.
- **Once-only comes from the projection**, not the claim: a successful comp writes
  `plan = 'free_legacy'`, so the in-memory predicate is false from then on, permanently.

**The lazy sync is still not enough on its own, so there are deliberately two trigger points.**
`triggerLazyBillingProviderSync` hangs off `getOrCreateForPlatform`, which the billing page, the
dashboard and both AI usage trackers reach, but the per-production-run credit does not:
`flow-run-hooks` goes `trackProductionRunCredit` to `trackCredits` to `resolveClientForPlatform` to
`loadAutumnCreds`, never touching `getOrCreateForPlatform`. A platform running only non-AI flows on a
schedule, with nobody logging in, was therefore never comped. The check is now also on
`loadAutumnCreds`, the choke point every EE billing path funnels through, so one production run is
enough. It is free there for the same reason as at the other site: `getAutumnCredentials` already
reads the row and was discarding `plan` and `created`.

Both sites share the `runOnceWithin` claim, which lives inside `ensureFreeLegacyComped` rather than at
either call site, so every caller is bounded by construction instead of by remembering. The cost of
keeping both is one redundant row read per eligible platform per claim window.

Two consolidations were considered and rejected. Making `getAutumnCredentials` delegate to
`getOrCreateForPlatform` would give a single trigger point and delete most of this wiring, but it puts
a `runOnceWithin` Redis round-trip on every production run's credit track, which is the cost the
`AP_EDITION=ee` run-gate short-circuit already exists to avoid, and it makes `ensureEnrolled` re-enter
itself through `getAutumnCredentials`, terminating only because the enrol claim is set before the body
runs. Dropping the lazy-sync trigger and keeping only `loadAutumnCreds` also works, since a plan read
reaches it through `throttledBillingProviderRefresh`, but a plan-read-only platform would then wait
for its next entitlements refresh (up to 15 min) instead of being checked on the spot.

`isFreeLegacyEligible` lives in `@activepieces/shared` rather than beside the comp because both the
in-memory gate in `platform-plan.service.ts` and the re-check inside the lock in `autumn-utils.ts`
need it, and `autumn-utils` already imports `platformPlanService` (importing back would be circular).
It uses `Date.parse` rather than dayjs so the shared bundle, which every web consumer pulls, does not
gain a dayjs import for one comparison.

**The comp is Cloud only**, gated on `edition === ApEdition.CLOUD`. `ensureEnrolled` runs on
Enterprise as well as Cloud (only Community and Testing are skipped) and `getInitialPlanByEdition`
returns `plan: 'free'` for both, so a self-hosted EE box that never activated a license key would
otherwise match the predicate and be comped unlimited credits and unlimited active flows on its own
hardware.

Enrol-first ordering is what makes the plan name safe to test. A dormant platform still carries the
pre-Autumn `'standard'` name until something refreshes it, but enrolment always calls
`refreshEntitlements` immediately after `setAutumnCredentials`, so by the time the check runs the name
is an Autumn plan id. `'standard'` is still accepted in the already-enrolled branch to cover the case
where that refresh threw. `plan IS NULL` is deliberately not accepted, so a dormant enterprise row
that never got a plan name cannot be comped.

## Consequences

- **Eligibility is evaluated live and forever, not frozen at a cutoff.** A platform created before
  30 July that was *paying* on 30 July and cancels later drops to `free` (Autumn auto-enables it) and
  then qualifies for the comp. This is known and accepted rather than overlooked; freezing the cohort
  was rejected below.
- **The cutoff sits a week after the catalog go-live, so the cohort is wider than "migrated from
  `standard`".** A platform created between 23 and 30 July 2026 was born directly on the Autumn `free`
  plan, never held `standard`, and so never lost the team project or the branding suppression that
  `free_legacy` gives back, yet it still qualifies. 30 July was chosen deliberately over the 23 July
  go-live date.
- Per platform the check is self-terminating: `toAutumnEntitlements` prefers any non-`free` plan id
  over `free`, so once comped the projection writes `plan = 'free_legacy'` and the predicate goes
  false.
- That self-termination depends on the comp calling `refreshEntitlements` straight after attaching.
  Without it `plan` stays `free` and every later `ensureEnrolled` re-comps, which is an attach storm
  against Autumn rather than a slow leak, since `ensureEnrolled` is awaited from roughly eight billing
  call sites. The comp also belongs inside the existing `getAutumnEnrollLockKey` lock with eligibility
  re-checked in there, because the already-enrolled branch no longer early-returns and two concurrent
  requests would otherwise both comp.
- Costs no extra query: `getAutumnCredentials` already does `findOneByOrFail({ platformId })` and
  discards the row, so `plan` and `created` are free.
- **Every site keyed on the plan *name* has to learn `free_legacy`; every site keyed on the *balance*
  already works.** The gates, Redis caches and chat block are balance-driven and need nothing. These
  are name-driven and are silently wrong until changed:
  - `chat-usage-tracker.ts` and `flow-run-ai-usage-tracker.ts` both decide whether to meter
    `appSumoAiCredits` with `plan?.toLowerCase().includes('appsumo')`, a substring test left over from
    the six-tier era. `free_legacy` fails it, so its 200 credits would never be spent and its
    unlimited `apCredits` never bind: unmetered AI, not a block.
  - `rate-limiter-interceptor.ts#concurrencyLimitForCloudPlan` lists `PlanName.APPSUMO` in the
    self-serve arm; `free_legacy` falls to `default:` and gets the **enterprise** concurrency bucket.
  - `provisionLicenseKeyIfPaid` early-returns on `FREE` and `APPSUMO` only, so it would attempt a
    console round-trip per refresh for the whole cohort. Harmless (the console declines a plan with no
    price) but wasteful.
  - `isCloudPlanButNotEnterprise` is `FREE || APPSUMO`, which drives `isCloudNonEnterprisePlan` and
    whether `delete-account.tsx` offers self-serve account deletion.
  - `feature-usage-cards.tsx` renders the hardcoded label `'AppSumo AI Credits'` whenever
    `appSumoAiCreditsUsed` is non-nil, and `billing/index.tsx` branches on
    `plan === PlanName.APPSUMO` for the auto-recharge note. Legacy free customers carry that balance,
    so the label is taken from the customer's plan rather than the feature id, and those branches
    widen to cover `free_legacy`. A legacy free customer must never see AppSumo wording.
- `PlanName` gains `FREE_LEGACY`. `free_legacy` stays out of `SUPPORTED_PLAN_IDS`, so it is never
  purchasable and never appears in the plan picker.

## Rejected

- **Freezing the cohort with a stamp column** (a one-time backfill setting something like
  `freeLegacyEligibleAt` on `platform_plan`, then comping off the stamp). Closes the churner hole
  above and makes the comp exactly-once, at the cost of an additive migration and a decision about
  which snapshot defines "was free on 30 July". Judged not worth it.
- **Granting only what was actually lost** (`free` plus `teamProjectsLimit: 1`, minus
  `showPoweredBy`). Cheaper and needs no AppSumo coupling at all, but was rejected in favour of
  matching AppSumo outright.
- **Letting the console self-select the cohort** from `autumn_customers`. Impossible: that table's
  `created_at` is when AP enrolled the platform, not when the platform signed up, and enrolment is
  lazy, so the column says nothing about who was on the free tier at the cutoff. The whole table also
  begins at the 23 July 2026 catalog go-live, which is only a week before the cutoff.
- **Keying the endpoint on email**, like `POST /api/external/grant-chat-plan` does for the chat
  rollout. `enroll` mints a fresh random customer per call and never dedupes by email, so one owner
  with two platforms has two rows and there is no unique key to resolve.
