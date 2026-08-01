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
