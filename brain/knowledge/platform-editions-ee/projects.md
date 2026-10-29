---
icon: 📂
---

# Projects

A **Project** is the workspace within a platform where flows, connections, tables, and other resources live. Every platform has at least one, always scoped via `platformId`. CE gives a single user one personal project; the EE ee-projects module extends this with team projects, limits, and admin CRUD. All editions.

### Entity & terms
- `project` entity: `ownerId`, `platformId`, `displayName`, `type`, `icon` (jsonb `{ color }`), `externalId` (nullable, for embedding mapping), `maxConcurrentJobs` (nullable cap), `releasesEnabled`, `metadata`, `poolId` (FK concurrency_pool), `deleted` (soft-delete timestamp). Unique `(platformId, externalId)` where not deleted.
- **ProjectType**: `PERSONAL` (auto-created on signup, one per user per platform) or `TEAM` (EE multi-member).
- Relations (one-to-many): flows, files, folders, events, appConnections, tables, fields, records, cells, tableWebhooks.

### Service methods
- `create({ displayName, ownerId, platformId, type, callPostCreateHooks?, postCreateContext?, ... })` — random icon color, fires `projectHooks.postCreate`. `postCreateContext` carries `alertReceiverEmail` for auto-subscribing an alert receiver on team projects.
- `update` — TEAM allows `displayName` + `icon`; PERSONAL allows neither.
- `getOne`/`getOneOrThrow`, `getAllForUser` (admins see all platform projects, members see assigned), `getUserProjectOrThrow` (CE list), `getProjectIdsByPlatform`, `countByPlatformIdAndType` (limit enforcement).

### Endpoints (CE level)
- `GET /v1/projects` — CE returns personal project only.
- `GET /v1/projects/:id` — single project.
- `POST /v1/projects/:id` — update display name + metadata.

### Gotchas
- `projectHooks.postCreate` is where EE creates the associated `ProjectPlan`, sets piece filters, and auto-subscribes an alert receiver (owner email for personal, `context.alertReceiverEmail` for team).
- Soft-deleted projects stay in DB; a background job hard-deletes them.
- **A default project is a flag on the project**, `project.isDefault` (see decision 000051). The database only allows it on team projects (`chk_project_is_default_team`). Admins set it per project with `POST /v1/projects/:id` and `isDefault`; only platform admins and API keys can, and a plan without project roles gets `FEATURE_DISABLED` (checked in the controller; the service only takes `enforceDefaultGuard`). There is no cap on how many defaults a platform has; the platform response reads them in cursor pages of 100, so no single query is unbounded. The platform response lists the live team projects with the flag as `defaultProjectIds`, oldest first. The order matters, because the invite dialog preselects the first default.
- The web project collection never sends `isDefault` when it saves other project settings, so a stale cache can't undo another admin's change. Defaults are only changed through `projectCollectionUtils.useSetDefaultProjects`.
- A soft-deleted project keeps its flag until the hard delete; reads skip deleted rows. A default project can't be deleted from the app while it is a default: remove it on Roles & Access first (see decision 000049). API-key deletes, SCIM group deletes, and plans without project roles still delete it. The app check is part of the soft delete (`AND "isDefault" = false`), not a read before it, so a project another admin makes a default mid-delete is still refused.

### Key files
Entry point: `projectService`, a log-taking factory in `project-service.ts` that every project read and write routes through.

- `packages/server/api/src/app/project/` — core service, TypeORM entity, repo, hooks, worker controller
- `packages/server/api/src/app/ee/projects/` — the whole `/v1/projects` HTTP surface plus members, roles, releases, plans
- `packages/core/shared/src/lib/management/project/` — `Project`, `ProjectPlan`, `ProjectIcon` and request schemas
- `packages/web/src/features/projects/components/` — project switcher, platform switcher, create and edit dialogs
- `packages/web/src/features/projects/stores/` — current-project store

Paths verified 2026-07-17. An earlier version pointed at `project/project-controller.ts`; that file is gone and the `/v1/projects` routes now register from `ee/projects/platform-project-module.ts`.
