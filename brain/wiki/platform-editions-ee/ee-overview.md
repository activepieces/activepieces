---
icon: 🏛️
---

# EE Overview

The Enterprise Edition extends CE with commercial features living under `packages/server/api/src/app/ee/`. EE code is **never imported from CE**; instead CE declares hook interfaces via `hooksFactory.create<T>(ceDefault)` and EE injects real implementations via `.set(eeImpl)` inside the edition switch in `app.ts` (~lines 247–317). Plan flags on `PlatformPlan` (40+ booleans) gate individual features at the endpoint level.

### Feature gating patterns
1. **Module-level** — edition switch in `app.ts` registers EE/Cloud modules conditionally on `ApEdition`.
2. **Endpoint-level** — `app.addHook('preHandler', platformMustHaveFeatureEnabled((p) => p.plan.myFlag))`; returns HTTP 402 `FEATURE_DISABLED` when the flag is false.
3. **Hooks pattern** — CE declares a no-op default interface; EE `.set()`s the real one; callers stay edition-agnostic.

### EE modules (with plan flag)
- audit-logs (`auditLogEnabled`), api-keys (`apiKeysEnabled`), global-connections (`globalConnectionsEnabled`), custom-domains (`customDomainsEnabled`), secret-managers (`secretManagersEnabled`), scim (`scimEnabled`), template (`manageTemplatesEnabled`), pieces (`managePiecesEnabled`).
- projects/project-role (`projectRolesEnabled` / `customRolesEnabled`), project-release git sync (`environmentsEnabled`), project-members + project-plan (ungated).
- signing-key + managed-authn for embedding (`embeddingEnabled`); authentication saml + federated (`ssoEnabled`), otp, enterprise-local-authn, project-role RBAC.
- platform-plan, license-keys, alerts, oauth-apps, platform-webhooks, appsumo, flags (`enterpriseFlagsHooks`), helper (SMTP + appearance), users, admin.

### Gotchas
- Some modules are Cloud-only, not self-hosted EE (AppSumo, cloud admin).
- Adding an EE feature: create module → add flag to `PlatformPlan` + `LicenseKeyEntity` + plan constants → gate with `platformMustHaveFeatureEnabled()` → register in `app.ts` → if extending CE, define hook in CE and `.set()` in EE.

### Key files
Entry point: `platformMustHaveFeatureEnabled`, exported from `ee/authentication/ee-authorization.ts` and added as a `preHandler` hook by each gated EE module.

- `packages/server/api/src/app/ee/` — all EE module source, one directory per module
- `packages/server/api/src/app/app.ts` — the edition switch that registers EE and Cloud modules
- `packages/server/api/src/app/helper/hooks-factory.ts` — the CE/EE seam, `hooksFactory.create` and `.set`
- `packages/server/api/src/app/ee/authentication/` — ee-authorization gating hooks, SAML, federated, OTP, project-role RBAC
- `packages/server/api/src/app/ee/platform/platform-plan/` — PlatformPlan entity with the flags, Stripe billing, AI credits
- `packages/server/api/src/app/ee/license-keys/` — license activation, trial, flag mapping
- `packages/server/api/src/app/ee/helper/` — SMTP email service and appearance/branding helper

Paths verified 2026-07-17.
