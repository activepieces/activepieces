# License Keys (License Activation)

## Summary
A license key is the customer's **activation/recovery handle** for their Autumn billing identity. A user pastes their
key into the billing UI; the AP backend saves it on `platform_plan.licenseKey` and **delegates activation to the
console** (`console.activepieces.com`), which resolves the key to an Autumn customer (creating one if needed),
attaches the plan, and returns scoped credentials. AP then projects the plan/feature entitlements from **Autumn**
(not from the key's own flags). AP no longer talks to `secrets.activepieces.com` and no longer stores per-feature
flags on the key — the console owns license data and Autumn owns entitlements.

> **History:** the legacy system (AP `/v1/license-keys/verify` + `licenseKeysService` → `secrets.activepieces.com` +
> `applyLimits` + the daily `TRIAL_TRACKER` re-validation job) was **removed** when billing moved to Autumn. Already
> released self-hosted builds bundle their own copy of that path and keep talking to `secrets.activepieces.com`
> independently — nothing in the current codebase serves them.

## Key Files
- `packages/server/api/src/app/ee/platform/platform-plan/platform-plan.controller.ts` — `POST /v1/platform-billing/activate`
  (license key in body; platformId from principal)
- `packages/server/api/src/app/platform/billing-provider.ts` — `activateLicense(params)` seam (CE no-op)
- `packages/server/api/src/app/ee/platform/platform-plan/autumn.ts` — EE `activateLicense` impl + `activateOnConsole`
  helper (`POST {console}/api/billing/activate`, Bearer license key)
- `packages/web/src/features/billing/components/activate-license-dialog.tsx` — activation dialog
- `packages/web/src/api/platforms-api.ts` — `activateLicenseKey()` → the activate endpoint
- `packages/web/src/hooks/platform-hooks.ts` — `useUpdateLisenceKey` mutation
- `packages/web/src/features/billing/components/license-key.tsx` — license-key display component

## Edition Availability
EE + Cloud (the activate seam is CE no-op). The `licenseKey` column on `platform_plan` is retained.

## Activation flow
1. User enters a license key in `activate-license-dialog` → `POST /v1/platform-billing/activate { licenseKey }`.
2. `activateLicense`: save `platform_plan.licenseKey` → `activateOnConsole({ licenseKey, platformId })` (Bearer key) →
   `setAutumnCredentials` (autumnCustomerId + scoped key) → `refreshEntitlements`.
3. Console `/api/billing/activate` resolves the key to an Autumn customer (idempotent: returns existing creds, else
   creates customer + mints a scoped key + attaches the license's plan with the comp term), and returns the creds.
4. Plan limits + feature flags are projected from Autumn via `mapEntitlementsToPlanLimits` — NOT from the key.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **Activation**: redeeming a license key to bind/recover the platform's Autumn customer and credentials.
- **Recovery handle**: a key maps to one Autumn customer; re-activating on a new instance returns the same customer
  (support hands the key back to a customer who lost their instance).
- **Comp term**: the console attaches a comped plan with `ends_at` (migrated legacy = +1yr, new = non-expiry, trial =
  +N days); on lapse Autumn `auto_enable` drops the customer to `free`.

## What lives in the console now (not AP)
License data (`license_keys` table with the plan to attach + term), the `autumn_customers` ledger, trial issuance,
and any `secrets.activepieces.com` interaction. See `~/.claude/plans/autumn-activation-migration.md`.
