---
icon: 🏢
---

# Platform & Editions (EE)

How Activepieces' tenancy (Platform → Project) and Community/Enterprise split work. Rule of thumb: CE never imports `src/app/ee/`; CE declares hook interfaces via `hooksFactory.create<T>(ceDefault)`, EE injects the real impl via `.set(eeImpl)` in the `app.ts` edition switch. Plan flags on `PlatformPlan` (40+ booleans) gate features per-endpoint with `platformMustHaveFeatureEnabled()` (HTTP 402).

### Platform (CE)
Top-level tenant namespace; every install has ≥1. Owns branding (logos, theme colors, favicon), auth config (email toggle, allowed domains, SSO providers), pinned pieces, and piece-selector tab layout. Entity `platform`; `platformService` (create/update, `getOneWithPlanAndUsageOrThrow`). Endpoints under `/v1/platforms/:id`. Gotcha: sensitive SSO/SAML secrets stripped → `PlatformWithoutSensitiveData`; SAML config change invalidates the SAML client cache; DELETE is Cloud-only (async hard-delete job). All editions.

### Project (CE)
Workspace inside a platform holding flows, connections, tables. `PERSONAL` (auto-created per user) or `TEAM` (EE). Always scoped by `platformId`; soft-delete via `deleted`. `projectService`; entity `project`. Gotcha: `projectHooks.postCreate` is the CE→EE seam — EE creates the `ProjectPlan`, sets piece filters, subscribes alert receiver. `externalId` maps projects to an embedder's own IDs.

### EE Overview
All commercial modules live under `src/app/ee/`, registered only for EE/Cloud in the `app.ts` edition switch (~lines 247-317). 30+ modules (audit-logs, api-keys, SSO/SCIM, secret-managers, global-connections, custom-domains, signing-key, managed-authn, project-members/roles/releases, billing…). Gate a new feature: add flag to `PlatformPlan`, guard with `platformMustHaveFeatureEnabled()`, register in `app.ts`, and if extending CE use the hooksFactory `.set()` pattern.

### EE Platform (billing / plan)
`PlatformPlan` = one-per-platform record: all feature flags + limits + billing state. Cloud uses Stripe (`STANDARD_CLOUD_PLAN`: 10 flows/200 credits); self-hosted EE uses license keys (no Stripe); CE = `OPEN_SOURCE_PLAN` (unlimited flows, all flags off). `checkActiveFlowsExceededLimit()` throws `QUOTA_EXCEEDED` (402), skipped in CE. AI credits via OpenRouter (1000 credits = $1) with monthly reset + Stripe auto-top-up. Cloud-only admin endpoints under `/v1/admin/*` (API_KEY auth).

### EE Projects (team / RBAC / releases)
Adds members, roles, git-sync releases, per-project piece sets on top of CE projects. RBAC: `rbacService.assertPrincipalAccessToProject()` branches by principal (USER→member role, ENGINE→projectId match, SERVICE→platform match). 3 default roles (ADMIN/EDITOR/VIEWER) + custom roles (`customRolesEnabled`) over 26 permissions. `ProjectRelease` (GIT_BRANCH/MANUAL/ROLLBACK) diffs then applies state atomically under a memory lock; gated by `environmentsEnabled`. Optional `workerGroupId` routes a project's flow jobs to a dedicated worker pool (`workerGroupsEnabled`).

### Embed / Signing Keys
Platform admin configures embedded workflows at `/platform/security/embed` (Cloud: 4 steps incl. Cloudflare hostname + DNS; CE/EE: 2 steps). Core is RSA-4096 signing keys (`/v1/signing-keys`, platform-admin only): private key returned exactly once, only public key stored. Vendor signs JWTs (RS256, `kid` = key id); AP verifies on `POST /v1/managed-authn/external-token`. `platform.allowedEmbedOrigins`, merged with the `AP_ALLOWED_EMBED_ORIGINS` env list, drives the CSP `frame-ancestors` header. Gated by `plan.embeddingEnabled`.
- *Avoid:* `allowedEmbedDomains` — the old field name, gone.

### License Keys
Activation for self-hosted EE. A key string encodes enabled feature flags + expiry; validated against `secrets.activepieces.com/license-keys`, then `applyLimits()` writes flags to the platform plan. Endpoints `/v1/license-keys` are **public** (used pre-auth during setup). `TRIAL_TRACKER` BullMQ job runs ~daily: re-validates every platform's key, calls `downgradeToFreePlan()` (all flags false) on expiry. `requestTrial()` creates trial keys; `SECRET_MANAGER_API_KEY` env needed for admin ops.

## Pages

- **Projects** — the workspace unit; personal vs team
- **Users** — platform membership and roles
- **User Invitations** — JWT invites, auto-accept for existing users
- **Platform Configuration** — branding, domains, settings
- **EE Overview** — what the enterprise layer adds
- **EE Platform (Plans & Billing)** — PlatformPlan flags, quotas, billing
- **EE Projects & RBAC** — ProjectRole and the 26 permissions
- **License Keys** — activating self-hosted EE
- **Embed** — signing keys, external tokens, the Cloudflare subdomain, and the frame-ancestors CSP
- **Platform Copilot** — retired; kept for the migration trail
