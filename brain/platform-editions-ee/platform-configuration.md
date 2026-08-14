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
- `DELETE /v1/platforms/:id` — Cloud only, owner only, refused while a subscription is active. Cuts the platform off (every member `INACTIVE`, every flow disabled and drained, API keys deleted), emails the owner, and schedules one `HARD_DELETE_PLATFORM` job ~7 days out. See [000026](../../decisions/000026-delete-platform-is-a-cloud-owner-action-purged-by-one-cascading-job.md).
- `GET /v1/platforms/assets/:id` — public asset download.

### Gotchas
- Per-project piece/action/trigger visibility is done via **piece sets**, NOT the platform.
- On GET for USER principals, `plan.chatEnabled` is rewritten to effective per-user chat visibility, and `licenseKey` is nulled for embedded users.
- Updating SAML config clears the cached SAML client (`invalidateSamlClientCache`).
- `usage` is only populated on non-Community editions; CE uses `OPEN_SOURCE_PLAN`.
- Branding file updates go through `fileService.uploadPublicAsset` before save.
- **A `platformId` column is not a foreign key.** Verified against the dev schema: only 18 FKs actually reference `platform(id)`, but 12 tables carry a `platformId` with **no FK at all** — `user`, `file`, `app_connection`, `piece_metadata`, `project_member`, `project_role`, `user_invitation`, `mcp_oauth_token`, `mcp_oauth_authorization_code`, `variable`, `concurrency_pool`, `tool_search_index`. Those never block a delete and never cascade; they orphan silently. Any teardown must delete them explicitly. Do not infer cascade behaviour from the presence of the column.
- **What blocks `DELETE FROM platform`** is now two constraints: `project` and `signing_key`, both `RESTRICT`. It used to be four — `tag` and `piece_tag` were `NO ACTION` and were dropped once it was clear the tables had outlived their feature. The other 14 FKs already `CASCADE`. Platform deletion failing for one tenant and not another almost always means a new blocking FK, not a member count.
- **Delete order is forced by `platform.ownerId → user` being `RESTRICT`**: the platform row must go before its owner's `user` row, never the reverse. `project.ownerId → user` is `NO ACTION`, so projects must also be gone before any user is deleted.
- Any new entity carrying `platformId` should declare its FK `ON DELETE CASCADE`. Otherwise add it by name to the teardown job (`ee/platform/platform-teardown-jobs.ts`), which deletes the two blockers and the twelve unconstrained tables itself — nothing in CI checks either. See [000026](../../decisions/000026-delete-platform-is-a-cloud-owner-action-purged-by-one-cascading-job.md).
- **Setting a user `INACTIVE` stops logins and nothing else.** The trigger scheduler, the BullMQ queue, and the `SERVICE` principal an API key produces never read `user.status`. Cutting a platform off means disabling every flow through `CHANGE_STATUS` (so `triggerSourceService.disable` unregisters webhooks and drops schedules), draining queued work with `batchDeleteByFlowId`, and deleting the platform's `api_key` rows — deactivating members alone leaves all of it running.

### Key files
Entry point: `platformModule`, registered on the Fastify app in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/platform/` — the whole server slice: module, controller, service, TypeORM entity, utils (`getPlatformIdForRequest`)
- `packages/server/api/src/app/ee/platform/platform-teardown-jobs.ts` — the `HARD_DELETE_PLATFORM` handler and the `stopPlatformExecution` cut-off the controller calls
- `packages/core/shared/src/lib/management/platform/` — shared zod models (`Platform`, `PlatformWithoutSensitiveData`, `PlatformPlan`, `PieceSelectorConfig`) and `UpdatePlatformRequestBody`
- `packages/web/src/hooks/platform-hooks.ts` — `useCurrentPlatform()` React Query hook
- `packages/web/src/features/platform-admin/hooks/branding-hooks.ts` — branding mutation hooks (sibling hooks in that dir cover other platform-admin areas)

Paths verified 2026-07-17.
