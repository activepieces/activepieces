---
icon: 💳
---

# EE Platform (Plans & Billing)

The EE Platform module manages billing, quota enforcement, AI credits, license keys, and cloud admin. The `PlatformPlan` entity (one per platform, 40+ columns) gates every enterprise feature flag, enforces active-flow limits, integrates with Stripe (Cloud) and OpenRouter (AI credits). Self-hosted EE uses license keys instead of Stripe.

### Entities & services
- **PlatformPlan** holds billing state (Stripe customer/subscription IDs + status/dates), AI credit config, feature flags (`tablesEnabled`, `ssoEnabled`, `scimEnabled`, `auditLogEnabled`, `embeddingEnabled`, `agentsEnabled`, `projectRolesEnabled`, `customRolesEnabled`, `globalConnectionsEnabled`, `apiKeysEnabled`, `secretManagersEnabled`, etc.), limits (`activeFlowsLimit`, `projectsLimit`, `teamProjectsLimit` NONE/ONE/UNLIMITED), license fields, and `dedicatedWorkers` jsonb.
- `platformPlanService.getUsage(platformId)` → `{ activeFlows, aiCreditsLimit, aiCreditsRemaining, totalAiCreditsUsed, totalAiCreditsUsedThisMonth }`.

### How it works
- **Quota**: `checkActiveFlowsExceededLimit()` runs on enable/publish; throws `QUOTA_EXCEEDED` (HTTP 402) when `activeFlows >= activeFlowsLimit`. Skipped in CE.
- **AI credits (OpenRouter)**: 1000 credits = $1 (`CREDIT_PER_DOLLAR`). Usage cached 180s. Monthly reset via `tryResetPlanIncludedCredits()`. Auto top-up (`tryAutoTopUpPlan()`) charges Stripe when below threshold, capped by `maxAutoTopUpCreditsMonthly`. Job `AI_CREDIT_UPDATE_CHECK`.
- **Stripe (Cloud only)**: customer on platform create, self-service portal, active-flows addon ($5/flow/month), one-time AI credit checkouts, webhook on `checkout.session.completed` / `invoice.paid` / `customer.subscription.*`.
- **License keys (self-hosted EE)**: `verifyKeyOrReturnNull`, `applyLimits` (maps license features to plan flags), `downgradeToFreePlan` on expiry.

### Gotchas
- Plan constants: `STANDARD_CLOUD_PLAN` = 10 active flows / 200 AI credits / 1 team project; `OPEN_SOURCE_PLAN` = unlimited flows / 0 credits / no team projects, all flags off.
- Cloud admin endpoints (API_KEY auth): `POST /v1/admin/pieces` (register piece metadata — mirrors framework `ActionBase`/`TriggerBase`, keep in sync), `.../runs/retry`, `.../apply-license-key`, `.../increase-ai-credits`, `.../dedicated-workers`.
- Frontend billing under `/v1/platform-billing/*` (info, portal, checkout, addon, ai-credits).

### Key files
Entry point: `platformPlanService`, exported from `platform-plan.service.ts` and called by consumers like `flows/flow/flow.controller.ts` for the quota check.

- `packages/server/api/src/app/ee/platform/platform-plan/` — plan service, entity, controller, Stripe billing controller and helper, OpenRouter client, AI credits service
- `packages/server/api/src/app/ee/platform/admin/` — cloud admin controller and service
- `packages/server/api/src/app/ee/license-keys/` — license key verification, apply limits, downgrade
- `packages/core/shared/src/lib/ee/billing/index.ts` — shared plan constants and zod schemas (`STANDARD_CLOUD_PLAN`, `OPEN_SOURCE_PLAN`)
- `packages/core/shared/src/lib/management/platform/` — `PlatformPlan` type and every feature-flag field
- `packages/web/src/features/billing/` — billing api, hooks and components (subscription info, active-flows addon, AI credits, license key)
- `packages/web/src/app/routes/platform/billing/index.tsx` — the Billing page, gated by edition

Paths verified 2026-07-17. An earlier version pointed at `packages/server/api/src/app/ee/billing/`; Stripe checkout, webhook and the billing controller now live in `packages/server/api/src/app/ee/platform/platform-plan/`.
