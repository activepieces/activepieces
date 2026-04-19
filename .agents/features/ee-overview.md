# Enterprise Edition (EE) Overview

## Summary
The Enterprise Edition extends the Community Edition with commercial features grouped into distinct modules under `packages/server/api/src/app/ee/`. EE modules are never imported from CE code; instead, CE defines hook interfaces via `hooksFactory.create<T>(ceDefault)` and EE implementations are injected via `.set(eeImpl)` inside the edition switch in `app.ts`. Plan flags on `PlatformPlan` (40+ boolean fields) gate individual features at the endpoint level using `platformMustHaveFeatureEnabled()`. License keys map to plan flag presets, enabling trial periods and per-customer feature combinations.

## Key Files
- `packages/server/api/src/app/ee/` — all EE module source code
- `packages/server/api/src/app/app.ts` — edition switch (lines ~247–317) where EE modules are registered
- `packages/server/api/src/app/ee/platform/platform-plan/` — PlatformPlan entity + Stripe billing + AI credits
- `packages/server/api/src/app/ee/license-keys/` — license activation, trial, plan flag mapping
- `packages/server/api/src/app/ee/authentication/ee-authorization.ts` — shared authorization preHandler hooks
- `packages/server/api/src/app/ee/helper/` — SMTP email service + appearance/branding helper

## Edition Availability
- **Community (CE)**: None of the modules in `src/app/ee/` are available.
- **Enterprise (EE)**: All modules available, individual features gated by plan flags.
- **Cloud**: All modules available; some modules registered for Cloud but not self-hosted EE (e.g., AppSumo integration, cloud admin).

## Domain Terms
- **PlatformPlan**: Entity with 40+ boolean flags representing purchased features; drives all `platformMustHaveFeatureEnabled` checks.
- **LicenseKey**: Activates a preset bundle of plan flags; supports trial mode with expiry date.
- **hooksFactory**: CE/EE integration point — CE declares the interface with a no-op default; EE sets the real implementation; callers are edition-agnostic.
- **platformMustHaveFeatureEnabled**: Fastify `preHandler` hook factory that returns HTTP 402 `FEATURE_DISABLED` when a plan flag is false.
- **Edition switch**: Block in `app.ts` that registers EE/Cloud modules conditionally based on `ApEdition`.

## Feature Gating Patterns

1. **Module-level**: Edition switch in `app.ts` (lines 247-317) — EE modules only registered for EE/Cloud editions
2. **Endpoint-level**: `app.addHook('preHandler', platformMustHaveFeatureEnabled((p) => p.plan.myFlag))`
3. **Hooks pattern**: `hooksFactory.create<MyHooks>(ceDefault)` → `hooks.set(eeImpl)` in `app.ts`

## All EE Modules

| Module | Purpose | Plan Flag |
|--------|---------|-----------|
| **audit-logs/** | 19 event types, structured data, IP tracking, date filtering | `auditLogEnabled` |
| **api-keys/** | Platform API keys (hashed, truncated, last-used tracking) | `apiKeysEnabled` |
| **projects/project-members/** | Team member management with role assignment | — |
| **projects/project-role/** | 3 default roles + custom roles with granular permissions | `projectRolesEnabled` / `customRolesEnabled` |
| **projects/project-release/** | Git sync, diff/apply releases, rollback, manual snapshots | `environmentsEnabled` |
| **projects/project-plan/** | Per-project piece filtering (NONE/ALLOWED) | — |
| **global-connections/** | Platform-wide shared connections across all projects | `globalConnectionsEnabled` |
| **custom-domains/** | White-label domains (PENDING → ACTIVE after DNS verification) | `customDomainsEnabled` |
| **signing-key/** | RSA-4096 keys for embedding JWT exchange | `embeddingEnabled` |
| **managed-authn/** | JWT exchange: external token → AP token + auto user/project creation | `embeddingEnabled` |
| **secret-managers/** | AWS Secrets Manager, HashiCorp Vault, CyberArk Conjur, 1Password. Redis cache 1hr. | `secretManagersEnabled` |
| **scim/** | SCIM 2.0: Users + Groups (→ Projects), discovery, Okta integration | `scimEnabled` |
| **authentication/saml-authn/** | SAML SSO (login → IdP → ACS callback) | `ssoEnabled` |
| **authentication/federated-authn/** | Google/GitHub OAuth SSO | `ssoEnabled` |
| **authentication/otp/** | One-time passwords (10-min expiry, email verification + password reset) | — |
| **authentication/enterprise-local-authn/** | Email verification + password reset via OTP | — |
| **authentication/project-role/** | RBAC enforcement: assertPrincipalAccessToProject() | — |
| **platform/platform-plan/** | PlatformPlan (40+ flags), Stripe billing, AI credits, auto top-up | — |
| **license-keys/** | License activation, trial (with expiry), feature mapping to plan | — |
| **alerts/** | Flow failure email notifications per project | — |
| **oauth-apps/** | Custom OAuth2 app credentials per piece (override defaults) | — |
| **platform-webhooks/** | Event destination management for parent app notification | — |
| **app-credentials/** | App-level credential storage | — |
| **connection-keys/** | Connection encryption key management | — |
| **template/** | Platform-specific custom templates | `manageTemplatesEnabled` |
| **pieces/** | Platform piece installation and management | `managePiecesEnabled` |
| **platform/admin/** | Cloud admin: retry runs, apply license, increase credits, dedicated workers | — |
| **appsumo/** | AppSumo marketplace integration | — |
| **flags/** | EE flag overrides via `enterpriseFlagsHooks` (theme, SSO, billing, branding) | — |
| **helper/** | Email service (SMTP templates), appearance helper (branding/themes) | — |
| **users/** | Platform-level user CRUD | — |

## Adding a New EE Feature

1. Create module in `src/app/ee/{feature}/`
2. If plan-gated: add flag to `PlatformPlan` entity + `LicenseKeyEntity` type + plan constants
3. Gate with `platformMustHaveFeatureEnabled()` in module
4. Register in `app.ts` EE section (or both EE+Cloud)
5. If extending CE behavior: define hook interface in CE, implement in EE, register via `.set()`
