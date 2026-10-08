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
- Deleting a project removes it from `defaultProjectIds` in the same transaction as the soft delete.
- The default projects list can be emptied whatever the personal projects setting, but a default project can't be deleted from the app while it is a default: remove it on Roles & Access first (see decision 000048). API-key deletes, SCIM group deletes, and plans without project roles still delete it and drop it from the list. Updates and deletes run under `platformService.runWithDefaultProjectsLock`, and a platform update only writes `defaultProjectIds` when the request includes it, so a concurrent delete can't be undone by a stale save.
- Default projects (`platform.defaultProjectIds`) only apply when a user is created; existing members are never backfilled or removed (see decision 000043). Only team projects of the same platform, and only on plans with `projectRolesEnabled`. Read them through `newMemberSettingsUtils.activeDefaultProjectIds` (`@activepieces/shared`, or `platformHooks.useNewMemberSettings()` in the web), never the raw field.
- The personal projects switch lives on Roles & access, not the Projects page, and never depends on default projects. What guarantees a new Member a project is the invite: the platform invite dialog requires one for Members (see [User Invitations](./user-invitations.md)).
- **Saved settings are not the effective ones.** Without `projectRolesEnabled`, a saved `autoCreatePersonalProjects: false` is kept but ignored: new members still get a personal project, and the saved "off" applies again after an upgrade. Read it through `newMemberSettingsUtils.personalProjectsActive`, never the raw field.
- **The switch only creates personal projects at sign-up.** `getOrCreateWithProject` makes one when the user row is created, never later, so people who joined while it was off have none. Turning it on offers a one-time `POST /v1/personal-projects/create-missing`, which schedules the `create-missing-personal-projects` system job: active, non-embedded (`provider != JWT`) members without a live personal project get one, under a per-platform `distributedLock` so a second run never duplicates. Nothing re-creates a personal project an admin deletes later, and turning the switch off never deletes any.

### Key files
Entry point: `projectService`, a log-taking factory in `project-service.ts` that every project read and write routes through.

- `packages/server/api/src/app/project/` — core service, TypeORM entity, repo, hooks, worker controller
- `packages/server/api/src/app/ee/projects/` — the whole `/v1/projects` HTTP surface plus members, roles, releases, plans
- `packages/core/shared/src/lib/management/project/` — `Project`, `ProjectPlan`, `ProjectIcon` and request schemas
- `packages/web/src/features/projects/components/` — project switcher, platform switcher, create and edit dialogs
- `packages/web/src/features/projects/stores/` — current-project store

Paths verified 2026-07-17. An earlier version pointed at `project/project-controller.ts`; that file is gone and the `/v1/projects` routes now register from `ee/projects/platform-project-module.ts`.
