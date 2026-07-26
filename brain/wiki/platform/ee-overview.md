---
icon: 🏛️
---

# EE Overview

The Enterprise Edition extends CE with commercial features living under `packages/server/api/src/app/ee/`. EE code is **never imported from CE**; instead CE declares hook interfaces via `hooksFactory.create<T>(ceDefault)` and EE injects real implementations via `.set(eeImpl)` inside the edition switch in `app.ts` (~lines 247–317). Boolean plan flags and numeric limits on `PlatformPlan` — projected from the platform's Autumn billing customer — gate individual features at the endpoint level.

### Feature gating patterns
1. **Module-level** — edition switch in `app.ts` registers EE/Cloud modules conditionally on `ApEdition`.
2. **Endpoint-level** — `app.addHook('preHandler', platformMustHaveFeatureEnabled((p) => p.plan.myFlag))`; returns HTTP 402 `FEATURE_DISABLED` when the flag is false.
3. **Hooks pattern** — CE declares a no-op default interface; EE `.set()`s the real one; callers stay edition-agnostic.

### EE modules (with plan flag)
- audit-logs (`auditLogEnabled`), api-keys (`apiKeysEnabled`), global-connections (`globalConnectionsEnabled`), secret-managers (`secretManagersEnabled`), scim (`scimEnabled`), template (`manageTemplatesEnabled`), pieces (`managePiecesEnabled`). (The custom-domains module is gone; the `customDomainsEnabled` column remains for backwards compatibility.)
- projects/project-role (`projectRolesEnabled` / `customRolesEnabled`), project-release git sync (`environmentsEnabled`), project-members + project-plan (ungated).
- signing-key + managed-authn for embedding (`embeddingEnabled`); authentication saml + federated (`ssoEnabled`), otp, enterprise-local-authn, project-role RBAC.
- platform-plan (Autumn billing + license-key activation), billing-usage-report, alerts, oauth-apps, platform-webhooks, appsumo, flags (`enterpriseFlagsHooks`), helper (SMTP + appearance), users, admin.

### Plan flags & limits (overview)
Feature flags are booleans on `PlatformPlan`; limits are `Nullable(number)` columns (null = unlimited, 0 = none, N = cap): `activeFlowsLimit`, `projectsLimit`, `billedTeamProjectsLimit` (numeric; the old `NONE/ONE/UNLIMITED` varchar `teamProjectsLimit` column stays until the cleanup PR — decision 000019), `usersLimit`, and `scheduledUsersLimit` (the seat cap of a pending scheduled downgrade; seat checks enforce `min(usersLimit, scheduledUsersLimit)`). All of it is a projection of the platform's Autumn entitlements — deep billing detail lives in [EE Platform (Plans & Billing)](./ee-platform-plans-billing.md).

### Gotchas
- Some modules are Cloud-only, not self-hosted EE (AppSumo, cloud admin).
- Adding an EE feature: create module → add flag to `PlatformPlan` + the Autumn feature mapping (`mapAutumnFeaturesToPlatformPlan` in `autumn-utils.ts`) + plan constants (`OPEN_SOURCE_PLAN`/`AUTUMN_FREE_PLAN`) → gate with `platformMustHaveFeatureEnabled()` → register in `app.ts` → if extending CE, define hook in CE and `.set()` in EE.
- The standalone `ee/license-keys/` module (remote verification, trial tracker, flag mapping) was deleted — a license key is now just an activation/recovery handle for the platform's Autumn customer, handled by the platform-plan billing providers (see [License Keys](./license-keys.md)).

### Key files
Entry point: `platformMustHaveFeatureEnabled`, exported from `ee/authentication/ee-authorization.ts` and added as a `preHandler` hook by each gated EE module.

- `packages/server/api/src/app/ee/` — all EE module source, one directory per module
- `packages/server/api/src/app/app.ts` — the edition switch that registers EE and Cloud modules
- `packages/server/api/src/app/helper/hooks-factory.ts` — the CE/EE seam, `hooksFactory.create` and `.set`
- `packages/server/api/src/app/ee/authentication/` — ee-authorization gating hooks, SAML, federated, OTP, project-role RBAC
- `packages/server/api/src/app/ee/platform/platform-plan/` — PlatformPlan entity with the flags and limits, plus the Autumn billing providers (`billing-providers/`) and license-key activation
- `packages/server/api/src/app/ee/helper/` — SMTP email service and appearance/branding helper

Paths verified 2026-07-26. An earlier version pointed at `packages/server/api/src/app/ee/license-keys/`; that module was removed when billing moved to Autumn.
