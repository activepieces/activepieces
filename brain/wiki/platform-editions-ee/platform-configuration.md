---
icon: 🏢
---

# Platform Configuration

A **Platform** is the top-level tenant namespace in Activepieces. Every install has at least one. It owns branding (logo, colors, favicon), auth settings (email auth toggle, allowed auth domains, federated SSO), and a `PlatformPlan` that governs feature flags and limits. On Cloud a user can own many platforms; on CE/EE there's typically one. Available in all editions.

### Entities & services
- `platform` entity: `ownerId`, `name`, `primaryColor`, `themeColors` (jsonb, null = derived from primaryColor), logo/favicon URLs, `cloudAuthEnabled`, `allowedAuthDomains`, `emailAuthEnabled`, `federatedAuthProviders` (jsonb OAuth2 + SAML), `pinnedPieces`, `pieceSelectorConfig` (jsonb, null = default tabs).
- `platformService`: `create`, `update`, `getOneWithPlanAndUsageOrThrow`, `getOneWithPlanOrThrow` (flags only, used in auth guards), `listPlatformsForIdentityWithAtleastProject` (platform-switcher), `getOldestPlatform` (CE single-platform resolution).

### Endpoints
- `GET /v1/platforms/:id` — plan + usage; sensitive SSO data stripped (`PlatformWithoutSensitiveData`).
- `POST /v1/platforms/:id` — platformAdminOnly; update branding, auth, piece pinning.
- `DELETE /v1/platforms/:id` — Cloud only; marks projects for deletion + schedules `HARD_DELETE_PLATFORM` job.
- `GET /v1/platforms/assets/:id` — public asset download.

### Gotchas
- Per-project piece/action/trigger visibility is done via **piece sets**, NOT the platform.
- On GET for USER principals, `plan.chatEnabled` is rewritten to effective per-user chat visibility, and `licenseKey` is nulled for embedded users.
- Updating SAML config clears the cached SAML client (`invalidateSamlClientCache`).
- `usage` is only populated on non-Community editions; CE uses `OPEN_SOURCE_PLAN`.
- Branding file updates go through `fileService.uploadPublicAsset` before save.

### Key files
Entry point: `platformModule`, registered on the Fastify app in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/platform/` — the whole server slice: module, controller, service, TypeORM entity, utils (`getPlatformIdForRequest`), and the `HARD_DELETE_PLATFORM` job handler
- `packages/core/shared/src/lib/management/platform/` — shared zod models (`Platform`, `PlatformWithoutSensitiveData`, `PlatformPlan`, `PieceSelectorConfig`) and `UpdatePlatformRequestBody`
- `packages/web/src/hooks/platform-hooks.ts` — `useCurrentPlatform()` React Query hook
- `packages/web/src/features/platform-admin/hooks/branding-hooks.ts` — branding mutation hooks (sibling hooks in that dir cover other platform-admin areas)

Paths verified 2026-07-17.
