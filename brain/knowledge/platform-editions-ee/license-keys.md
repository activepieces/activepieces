---
icon: 🔑
---

# License Keys

A license key is a self-hosted customer's **activation/recovery handle** for their Autumn billing identity — an opaque string, not a bundle of feature flags. The user pastes it into the billing UI; the AP backend delegates activation to the Activepieces console, which resolves the key to an Autumn customer (creating one if needed), attaches the license's plan, and returns `autumnCustomerId` plus a customer-scoped Autumn key. Plan limits and feature flags are then projected from **Autumn entitlements** — never from the key itself. EE + Cloud; the whole seam is a CE no-op on `billingProvider`.

> **History:** the legacy system — public `/v1/license-keys/*` endpoints, `licenseKeysService` (`verifyKeyOrReturnNull`, `applyLimits`, `downgradeToFreePlan`), the daily `TRIAL_TRACKER` job, and all `secrets.activepieces.com` calls — was **deleted** when billing moved to Autumn. Already-released self-hosted builds bundle their own copy of that path; nothing in the current codebase serves them.

### How it works
- `autumnBilling.activateLicense({ platformId, licenseKey })` — calls `autumnConsole.activate({ licenseKey })` (`POST {console}/api/v1/billing/activate`, key as Bearer token), then saves `platform_plan.licenseKey`, stores the returned credentials via `platformPlanService.setAutumnCredentials`, and runs `refreshEntitlements`.
- Console `/activate` is idempotent — a key maps to one Autumn customer, so re-activating on a fresh instance returns the same customer + creds (support hands the key back to a customer who lost their instance).
- `refreshEntitlements` — fetches the Autumn customer and writes `mapAutumnFeaturesToPlatformPlan` output onto `platform_plan`: `plan`, `billedTeamProjectsLimit`, `usersLimit`, `activeFlowsLimit`, `includedCredits`, and every boolean flag feature.
- `ensureEnrolled` — lazy enrollment under a `distributedLock`; if a `licenseKey` is already stored it re-activates through the console, otherwise `enrollFree` with the platform owner's email.
- `provisionLicenseKeyIfPaid` — during `refreshEntitlements`, self-serve paid customers who never entered a key get one minted by the console and saved, so every paying platform ends up with a recovery handle.

### Endpoints
- `POST /v1/platform-billing/activate` — body `{ licenseKey }`, `securityAccess.platformAdminOnly([USER])`; thin wrapper over `billingProvider.activateLicense` with `platformId` from the principal.
- `POST /v1/admin/platforms/apply-license-key` — cloud admin (module-level `api-key` header preHandler checked against `AppSystemProp.API_KEY`); body `{ email, licenseKey }`; resolves email → platform-admin user → owned platform, then calls the same `activateLicense`.

### Gotchas
- The key's contents are never read by AP — the console owns license data (`license_keys` table, plan-to-attach + term, trial issuance, `autumn_customers` ledger). Old-world per-feature flags on the key no longer exist.
- In `activateLicense` the console call happens **before** `platform_plan.licenseKey` is saved — a rejected key is never persisted.
- `AUTUMN_CONSOLE_URL` is a hardcoded constant in `autumn-utils.ts` (currently the testing console); all console calls go through `safeHttp` with a request timeout.
- The `licenseKey` column on `platform_plan` is retained; there is no expiry job in AP — plan lapse is handled console/Autumn-side and lands here via entitlement refresh. **A license's `expiresAt` currently has no effect for non-trial keys:** the console's comp attach sends `customize: { price: null }` with no `ends_at`, so the comped plan never lapses. Nothing in AP reads `licenseExpiresAt` either.
- **A trial key with a null or past `expiresAt` activates into no plan at all.** Console `activate` attaches only when `isTrial && trialDaysRemaining(expiresAt) >= 1`, else when `!isTrial` (comp) — a trial whose remaining days round to 0 falls through both branches, the customer is created with no subscription, and Autumn's `auto_enable` puts it on `free`. The platform then gets every EE flag revoked, one seat, `billingEnforced` on and powered-by branding on its first request after upgrade.
- **The Autumn plan is the whole truth on refresh.** `mapAutumnFeaturesToPlatformPlan` does `flags[feature] = entitlements.flags[feature] ?? false`, so any flag the target plan omits is revoked — a license-key → plan mapping that drops one feature silently downgrades that customer. Audit a migration mapping flag-by-flag against the live Autumn catalog before shipping it, not just plan-by-plan.
- Activation is fail-safe but retried: if the console call throws, credentials are never saved and the existing `platform_plan` flags stand; `ensureEnrolled` is re-attempted every 300s (`getEnrollAttemptKey`), and entitlement refresh is throttled to 15 min thereafter.
- **The billing page shows the activation section on Cloud too** — labelled "Trial Keys" while `platform_plan.licenseKey` is null, since a Cloud platform's key is normally an enterprise trial key handed out by sales. It used to be hidden behind an Alt+A keydown easter egg on the billing route; that reveal was removed (support could not talk customers through it).
- Enrollment without a key is **not** the old open-source default. `enrollFree` lands the platform on Autumn `free` (`aiProvidersEnabled: false`, `usersLimit: 1`, `billingEnforced: true`, `showPoweredBy: true`), which is materially narrower than the `OPEN_SOURCE_PLAN` an unlicensed EE instance used to get.

### Key files
Entry point: `activateLicense` on `billingProvider` (CE no-op in billing-provider.ts, EE impl in autumn-billing.ts), called from the platform-plan controller and the cloud admin service.

- `packages/server/api/src/app/ee/platform/platform-plan/platform-plan.controller.ts` — `POST /v1/platform-billing/activate`
- `packages/server/api/src/app/platform/billing-provider.ts` — `activateLicense(params)` seam (CE no-op)
- `packages/server/api/src/app/ee/platform/platform-plan/billing-providers/autumn-billing.ts` — EE `activateLicense` impl
- `packages/server/api/src/app/ee/platform/platform-plan/billing-providers/autumn-utils.ts` — `autumnConsole.activate`, `ensureEnrolled`, `refreshEntitlements`, `provisionLicenseKeyIfPaid`
- `packages/server/api/src/app/ee/platform/admin/` — admin controller (`/platforms/apply-license-key`) and `applyLicenseKeyByEmail` service
- `packages/core/shared/src/lib/management/platform/platform.request.ts` — `ApplyLicenseKeyByEmailRequestBody`
- `packages/web/src/features/billing/components/` — `activate-license-dialog.tsx` (activation flow) and `license-key.tsx` (key display)
- `packages/web/src/api/platforms-api.ts` — `activateLicenseKey()`; mutation in `packages/web/src/hooks/platform-hooks.ts`

Paths verified 2026-07-26. An earlier version described the pre-Autumn world (`packages/server/api/src/app/ee/license-keys/`, remote verification against `secrets.activepieces.com`, `applyLimits`, `TRIAL_TRACKER`); that module was removed.
