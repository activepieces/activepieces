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
- **A stale `projectId` in localStorage can survive a platform switch and, if the platform has chat disabled, spin the SPA into an infinite redirect loop.** `getProjectId()` (`lib/authentication-session.ts`) trusts localStorage over the current JWT. The access guard (`TokenCheckerWrapper`, `app/guards/project-route-wrapper.tsx`) denies and bounces to `/` but never clears the stale value, and `determineDefaultRoute()` (`lib/route-utils.ts`) only avoids reusing it when `chatEnabled` is true — which it isn't once Cloud's 200-user chat rollout cap closes (`ee/agent/chat-rollout-service.ts`). Confirmed live: React "Maximum update depth exceeded" + tab OOM, not just a toast. Reproduces with zero devtools via two tabs: one switches/creates a platform; the other, still holding a stale "yes I have access" cache, clicks any in-app nav link in its old project — that click's own `switchToProject()` call clobbers the shared `projectId` independently of the token. Two real Cloud support tickets (Pylon #3981, #3845, both same org) show the milder form of this class — landing on the wrong platform after sign-in — both closed as "fixed" with no root cause recorded.

### Key files
Entry point: `projectService`, a log-taking factory in `project-service.ts` that every project read and write routes through.

- `packages/server/api/src/app/project/` — core service, TypeORM entity, repo, hooks, worker controller
- `packages/server/api/src/app/ee/projects/` — the whole `/v1/projects` HTTP surface plus members, roles, releases, plans
- `packages/core/shared/src/lib/management/project/` — `Project`, `ProjectPlan`, `ProjectIcon` and request schemas
- `packages/web/src/features/projects/components/` — project switcher, platform switcher, create and edit dialogs
- `packages/web/src/features/projects/stores/` — current-project store

Paths verified 2026-07-17. An earlier version pointed at `project/project-controller.ts`; that file is gone and the `/v1/projects` routes now register from `ee/projects/platform-project-module.ts`.
