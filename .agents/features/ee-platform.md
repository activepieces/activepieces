# EE Platform Module

## Summary
The EE Platform module manages billing, quota enforcement, AI credits, license keys, and cloud admin operations for the Activepieces platform. It provides the `PlatformPlan` entity that gates every enterprise feature flag, enforces active-flow limits, and integrates with Stripe for cloud subscriptions and OpenRouter for AI credit accounting. Self-hosted Enterprise installs use license keys instead of Stripe to unlock features.

## Key Files
- `packages/server/api/src/app/ee/platform/` — backend service and controller
- `packages/server/api/src/app/ee/billing/` — Stripe webhook, checkout, billing controller
- `packages/shared/src/lib/ee/billing/index.ts` — shared plan constants, Zod schemas, `STANDARD_CLOUD_PLAN`, `OPEN_SOURCE_PLAN`
- `packages/shared/src/lib/management/platform/` — `PlatformPlan` type and all feature-flag fields
- `packages/web/src/features/billing/api/billing-plans-api.ts` — `platformBillingApi` (portal, checkout, AI credits, auto top-up)
- `packages/web/src/features/billing/hooks/billing-hooks.ts` — `billingQueries`, `billingMutations`
- `packages/web/src/features/billing/components/` — `SubscriptionInfo`, `ActiveFlowAddon`, `AICreditUsage`, `LicenseKey`, `PurchaseAICreditsDialog`, `AutoTopUpConfigDialog`
- `packages/web/src/app/routes/platform/billing/index.tsx` — Billing page (gated by edition, uses `LockedFeatureGuard`)

## Edition Availability
- **Community (CE)**: No billing UI. `OPEN_SOURCE_PLAN` applied — unlimited flows, 0 AI credits, no team projects. All feature flags off.
- **Enterprise (EE, self-hosted)**: License key activates feature flags. No Stripe. `downgradeToFreePlan` reverts on expiry.
- **Cloud**: Full Stripe integration. `STANDARD_CLOUD_PLAN` is the default; paid addons unlock higher active-flow limits and AI credits. Cloud Enterprise has all flags enabled.

## Domain Terms
- **PlatformPlan**: The single entity (one-per-platform) holding all billing state, feature flags, and limits.
- **Active Flows**: Published and enabled flows that count against the `activeFlowsLimit` quota.
- **AI Credits**: Usage currency for OpenRouter-backed AI actions. 1000 credits = $1 USD.
- **Auto Top-Up**: Automatic Stripe invoice triggered when AI credits fall below a configured threshold.
- **License Key**: A signed token (self-hosted EE) that maps to a feature set and expiration date.
- **QUOTA_EXCEEDED**: The HTTP 402 error code thrown when the active flow limit is reached.
- **Included Credits**: Credits bundled in the plan that reset monthly via `tryResetPlanIncludedCredits()`.

## PlatformPlan Entity (40+ columns)

**Billing**: plan (name), stripeCustomerId, stripeSubscriptionId, stripeSubscriptionStatus, stripeSubscriptionStartDate, stripeSubscriptionEndDate, stripeSubscriptionCancelDate.

**AI Credits**: includedAiCredits, lastFreeAiCreditsRenewalDate, aiCreditsAutoTopUpState (ENABLED/DISABLED), aiCreditsAutoTopUpCreditsToAdd, aiCreditsAutoTopUpThreshold, maxAutoTopUpCreditsMonthly.

**Feature Flags** (boolean): tablesEnabled, eventStreamingEnabled, environmentsEnabled, analyticsEnabled, showPoweredBy, auditLogEnabled, embeddingEnabled, agentsEnabled, managePiecesEnabled, manageTemplatesEnabled, customAppearanceEnabled, projectRolesEnabled, customDomainsEnabled, globalConnectionsEnabled, customRolesEnabled, apiKeysEnabled, ssoEnabled, scimEnabled, secretManagersEnabled.

**Limits**: activeFlowsLimit (nullable), projectsLimit (nullable), teamProjectsLimit (NONE/ONE/UNLIMITED).

**License**: licenseKey, licenseExpiresAt.

**Workers**: dedicatedWorkers (JSONB: trustedEnvironment).

## Usage & Quota Enforcement

`platformPlanService.getUsage(platformId)` returns: `{ activeFlows, aiCreditsLimit, aiCreditsRemaining, totalAiCreditsUsed, totalAiCreditsUsedThisMonth }`

`checkActiveFlowsExceededLimit()` — called when enabling/publishing flows. Throws `QUOTA_EXCEEDED` (402) if `activeFlows >= activeFlowsLimit`. Skipped in CE edition.

## AI Credits (OpenRouter)

- Rate: 1000 credits = $1 USD (`CREDIT_PER_DOLLAR = 1000`)
- Usage cached 180s from OpenRouter API
- Monthly reset: `tryResetPlanIncludedCredits()` adds `includedAiCredits / 1000` to OpenRouter key limit
- Auto top-up: `tryAutoTopUpPlan()` checks threshold → creates Stripe invoice → charges payment method
- Monthly limit enforcement: sums paid auto-topup invoices this month vs `maxAutoTopUpCreditsMonthly`
- System job: `AI_CREDIT_UPDATE_CHECK` — fires on provider creation, runs both reset + topup checks

## Stripe Integration (Cloud only)

- `createCustomer()` — on platform creation
- `createPortalSessionUrl()` — self-service billing portal
- Active flows addon: subscription with per-unit pricing ($5/flow/month)
- AI credits: one-time payment checkout sessions
- Auto top-up: setup mode checkout (collects payment method) → automatic invoices
- Webhook handler: `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`

## License Keys (Self-hosted EE)

- `requestTrial(email, companyName, goal)` — request from licensing server
- `verifyKeyOrReturnNull(platformId, license)` — validate + mark activated
- `applyLimits(platformId, key)` — maps license features to PlatformPlan flags
- `downgradeToFreePlan(platformId)` — disables all EE features
- License has expiration date, trial flag

## Admin Endpoints (Cloud only, API_KEY auth)

- `POST /v1/admin/pieces` — register piece metadata
- `POST /v1/admin/platforms/runs/retry` — batch retry failed runs
- `POST /v1/admin/platforms/apply-license-key` — activate license by email
- `POST /v1/admin/platforms/increase-ai-credits` — manually add credits
- `POST /v1/admin/platforms/dedicated-workers` — enable/disable dedicated workers

## Frontend Billing API

`/v1/platform-billing/info` — `GET`, returns `PlatformBillingInformation` (plan details + usage).
`/v1/platform-billing/portal` — `POST`, returns Stripe portal URL (opens in new tab).
`/v1/platform-billing/create-checkout-session` — `POST`, creates subscription checkout → navigates to Stripe.
`/v1/platform-billing/update-active-flows-addon` — `POST`, changes active-flow limit addon.
`/v1/platform-billing/ai-credits/create-checkout-session` — `POST`, one-time AI credit purchase.
`/v1/platform-billing/ai-credits/auto-topup` — `POST`, configure or disable auto top-up; may return `stripeCheckoutUrl` for first-time payment method setup.

## Plan Constants (from shared)

- `STANDARD_CLOUD_PLAN`: 10 active flows, 200 AI credits, 1 team project
- `OPEN_SOURCE_PLAN`: unlimited flows, 0 AI credits, no team projects
