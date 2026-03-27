# EE Platform Module

Billing, quota enforcement, AI credits, license keys, and cloud admin.

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

## Plan Constants (from shared)

- `STANDARD_CLOUD_PLAN`: 10 active flows, 200 AI credits, 1 team project
- `OPEN_SOURCE_PLAN`: unlimited flows, 0 AI credits, no team projects
