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
- **`maxConcurrentJobs` does nothing by default.** `AP_PROJECT_RATE_LIMITER_ENABLED` defaults to `'false'` (`system.ts`), so on a stock self-hosted install — CE *and* EE — `rateLimiterInterceptor` short-circuits and there is no per-project concurrency limit at all; the only bound is physical (`WORKER_CONCURRENCY` × replicas, since the worker *is* the sandbox). When it *is* enabled the effective limit is not one number: `getMaxConcurrentJobs` takes the `concurrency_pool` limit if `project.poolId` is set, else the cloud plan limit (`STANDARD` 5 → `ENTERPRISE` 30) or `AP_DEFAULT_CONCURRENT_JOBS_LIMIT` (5) off-cloud, then `min`s that with the routed pool's live worker slots when worker groups are on. It only applies to `EXECUTE_FLOW` and never to `RunEnvironment.TESTING`. Both `PROJECT_RATE_LIMITER_ENABLED` and `DEFAULT_CONCURRENT_JOBS_LIMIT` already ship to the web app as `ApFlagId` flags, but the flag carries the *env default*, not the effective limit — so the "Max Concurrent Jobs" field in Project Settings → General shows `Default (5)` even on a cloud plan whose real limit is 30. That field is `PlatformRole.ADMIN`-only and hidden entirely once `workerGroupsEnabled`, when the number moves to platform admin → Infra → Workers → By project. No surface anywhere shows a project's *live* running count, though it is one `ZCARD` on the limiter's Redis ZSET.

### Key files
Entry point: `projectService`, a log-taking factory in `project-service.ts` that every project read and write routes through.

- `packages/server/api/src/app/project/` — core service, TypeORM entity, repo, hooks, worker controller
- `packages/server/api/src/app/ee/projects/` — the whole `/v1/projects` HTTP surface plus members, roles, releases, plans
- `packages/core/shared/src/lib/management/project/` — `Project`, `ProjectPlan`, `ProjectIcon` and request schemas
- `packages/web/src/features/projects/components/` — project switcher, platform switcher, create and edit dialogs
- `packages/web/src/features/projects/stores/` — current-project store

Paths verified 2026-07-17. An earlier version pointed at `project/project-controller.ts`; that file is gone and the `/v1/projects` routes now register from `ee/projects/platform-project-module.ts`.
