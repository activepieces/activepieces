# EE Platform Module

## Summary
The EE Platform module manages billing, quota enforcement, AI credits, and cloud admin operations. Billing runs on
**Autumn** (useautumn) as the entitlements/billing engine for **EE + Cloud** (CE is unbilled). Each platform is an
Autumn **customer**: AP holds a per-platform `autumnCustomerId` + scoped `autumnApiKey` on `platform_plan` and calls
Autumn directly. Feature flags and numeric limits are **projected from Autumn** onto the `PlatformPlan` entity
(lazy-on-read); credit usage is metered to Autumn via `track`. License keys are an **activation/recovery handle** —
redeemed through the console, which provisions the Autumn customer (the old Stripe + `secrets.activepieces.com` paths
are gone).

## Key Files
- `packages/server/api/src/app/ee/platform/platform-plan/autumn.ts` — the whole Autumn implementation: exports
  `autumnBillingProvider` (EE impl of the seam) + `autumnUtils` (client, resolve/enroll, `refreshEntitlements`,
  `mapEntitlementsToPlanLimits`, credit-balance caches, console helpers)
- `packages/server/api/src/app/platform/billing-provider.ts` — the `BillingProvider` seam (CE no-op + EE impl)
- `packages/server/api/src/app/ee/platform/platform-plan/platform-plan.{service,controller,entity}.ts`
- `packages/core/shared/src/lib/ee/billing/index.ts` — plan constants (`STANDARD_CLOUD_PLAN`, `OPEN_SOURCE_PLAN`, `AUTUMN_FREE_PLAN`, `APPSUMO_PLAN`)
- `packages/core/shared/src/lib/management/platform/platform.model.ts` — `PlatformPlan` + `AutumnFeatureId`
- `packages/web/src/features/billing/` — `billing-plans-api.ts`, `billing-hooks.ts`, components (below)

## Edition Availability
- **Community (CE)**: unbilled. `OPEN_SOURCE_PLAN` applied; `BillingProvider` is a no-op (never creates an Autumn customer).
- **Enterprise (EE, self-hosted) + Cloud**: billed via Autumn. Each platform lazily enrolls as an Autumn customer
  (console `/subscribe` for free, or `/activate` with a license key); entitlements project onto `platform_plan`.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **PlatformPlan**: one-per-platform entity holding projected feature flags + limits + Autumn credentials.
- **Autumn customer / scoped key**: `autumnCustomerId` + `autumnApiKey` (entity-only, never serialized to clients).
- **apCredits**: the credit currency (flow runs + AI steps + chat burn it), metered to Autumn.
- **appSumoAiCredits**: a parallel, AppSumo-only finite cap on managed-`ACTIVEPIECES` AI spend (always-on gate).
- **billingEnforced**: per-platform kill-switch (Redis-cached) — `shouldBlock` returns true only when set (else OBSERVE).
- **QUOTA_EXCEEDED**: 402 thrown when a hard cap (active-flows / users) or an enforced credit balance is exceeded.

## PlatformPlan Entity
- **Billing/identity**: `plan` (verbatim Autumn plan id, nullable), `autumnCustomerId`, `autumnApiKey` (both entity-only),
  `billingEnforced`, `licenseKey`, `licenseExpiresAt`.
- **AI credits**: `includedAiCredits` (the projected grant).
- **Feature flags** (boolean): tables, eventStreaming, environments, analytics, showPoweredBy, auditLog, embedding,
  aiProviders, chat, dataManipulation, managePieces, manageTemplates, customAppearance, projectRoles,
  globalConnections, customRoles, apiKeys, sso, scim, secretManagers.
- **Limits** (`Nullable(number)`, null = unlimited / 0 = none / N = cap): `activeFlowsLimit`, `teamProjectsLimit`, `usersLimit`, `projectsLimit`.
- **Workers**: `dedicatedWorkers`, `workerGroupId`, `canary`, `customDomainsEnabled`.
- *(Removed when billing moved to Autumn: all `stripe*` cols, the `aiCreditsAutoTopUp*` / `lastFreeAiCreditsRenewalDate` cols, `agentsEnabled`.)*

## Usage & Quota Enforcement
- `getUsage(platformId)` → `{ activeFlows, aiCreditsLimit, aiCreditsRemaining, totalAiCreditsUsed, totalAiCreditsUsedThisMonth, appSumoAiCredits }`.
- `checkActiveFlowsExceededLimit()` — **always-on**, throws `QUOTA_EXCEEDED` when `activeFlows >= activeFlowsLimit` (null = unlimited). CE-skipped.
- `checkUsersExceededLimit()` — **send-time only, OBSERVE-gated** (`shouldBlock`); throws at invite-send when a new seat would exceed `usersLimit`. (No accept-time enforcement — see billing-status plan.)
- **Credit gate**: flow-run admission (`submitPayloads` → retryable `QUOTA_EXCEEDED` run, payload preserved), chat block, and the per-AI-step `GET /:provider/config` gate. `apCredits` gate is `shouldBlock`-gated; the `appSumoAiCredits` cap is always-on.

## Autumn Integration
- **Metering**: `aiUsageTracker.track` / chat / flow-run-hooks → `billingProvider.trackCredits` (+`trackAppSumoAiUsage`) → Autumn `track` (idempotency via the `Idempotency-Key` header; 409 = no-op).
- **Entitlements**: PULL only (no webhooks). `refreshEntitlements` fires lazy-on-read (Redis-claim deduped ~15 min), `getCustomer` → `mapEntitlementsToPlanLimits` → `platformPlanService.update`. Fail-open on Autumn outage (`failOpen`).
- **Managed AI**: OpenRouter key per platform with a flat `$20` lifetime backstop (`ai-provider-service.ts`).
- **Checkout/top-up/portal**: via the scoped key today (moves to console once real `keys.mint` scoped keys land).

## License-Key Activation
`POST /v1/platform-billing/activate { licenseKey }` → `billingProvider.activateLicense` → save `licenseKey` → console
`/api/billing/activate` (Bearer key) → store creds → `refreshEntitlements`. The legacy `/verify` + `licenseKeysService`
+ `secrets.activepieces.com` path was deleted. See `.agents/features/license-keys.md`.

## Admin Endpoints (Cloud, API-key auth)
- `POST /v1/admin/pieces` · `POST /v1/admin/platforms/runs/retry` · `POST /v1/admin/platforms/increase-ai-credits` · `POST /v1/admin/platforms/dedicated-workers`. *(`apply-license-key` was removed — customers self-activate via `/activate`.)* The `/v1/admin/pieces` action/trigger body schema mirrors the framework's `ActionBase`/`TriggerBase` (incl. `outputSchema`, `aiMetadata`, `audience`) so no fields are stripped on ingest — keep it in sync when the framework contract gains fields.

## Frontend Billing API (`/v1/platform-billing/*`)
`info` (GET) · `plans` (GET) · `checkout` (POST) · `portal` (POST) · `activate` (POST) ·
`consumable-product-topups/checkout` (POST, manual top-up) · `consumable-product-topups/auto-topup` (POST, native Autumn auto-top-up).
Components: `subscription-info`, `manage-plan-dialog` (plan picker), `active-flows-addon` ("Manage Plan" button),
`ai-credits/{ai-credit-usage, consumable-product-topups-dialog, auto-topup-config-dialog}`, `license-key`,
`activate-license-dialog`, `features-status`, `success`.

## Plan Constants (from shared)
- `STANDARD_CLOUD_PLAN`: 10 active flows, 200 AI credits, 1 team project · `AUTUMN_FREE_PLAN`: 100 credits, 1 project ·
  `OPEN_SOURCE_PLAN`: unlimited flows, 0 AI credits · `APPSUMO_PLAN(tier)`: appsumo tiers.
