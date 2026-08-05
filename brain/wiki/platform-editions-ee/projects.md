---
icon: 📂
---

# Projects

A **Project** is the workspace within a platform where flows, connections, tables, and other resources live. Every platform has at least one, always scoped via `platformId`. CE gives a single user one personal project; the EE ee-projects module extends this with team projects, limits, and admin CRUD. All editions.

### Entity & terms
- `project` entity: `ownerId`, `platformId`, `displayName`, `type`, `status`, `icon` (jsonb `{ color }`), `externalId` (nullable, for embedding mapping), `maxConcurrentJobs` (nullable cap), `releasesEnabled`, `metadata`, `poolId` (FK concurrency_pool), `deleted` (soft-delete timestamp). Unique `(platformId, externalId)` where not deleted.
- **ProjectType**: `PERSONAL` (auto-created on signup, one per user per platform) or `TEAM` (EE multi-member).
- **ProjectStatus**: `ACTIVE` (default) or `INACTIVE` — a reversible execution suspension, distinct from the one-way `deleted` soft-delete. See *Inactive projects* below.
- Relations (one-to-many): flows, files, folders, events, appConnections, tables, fields, records, cells, tableWebhooks.

### Service methods
- `create({ displayName, ownerId, platformId, type, callPostCreateHooks?, postCreateContext?, ... })` — random icon color, fires `projectHooks.postCreate`. `postCreateContext` carries `alertReceiverEmail` for auto-subscribing an alert receiver on team projects.
- `update` — TEAM allows `displayName` + `icon`; PERSONAL allows neither.
- `getOne`/`getOneOrThrow`, `getAllForUser` (admins see all platform projects, members see assigned), `getUserProjectOrThrow` (CE list), `getProjectIdsByPlatform`, `countByPlatformIdAndType` (limit enforcement).

### Endpoints (CE level)
- `GET /v1/projects` — CE returns personal project only.
- `GET /v1/projects/:id` — single project.
- `POST /v1/projects/:id` — update display name + metadata. Also the only way to set `status`.

### Inactive projects

`status: INACTIVE` suspends a project's execution without touching its flows. It is enforced at **admission**, not by holding the queue: nothing new is enqueued, and a `FlowRun` is still persisted in the terminal `PROJECT_INACTIVE` state carrying the trigger payload, so the work is replayable via the ordinary bulk retry (`POST /v1/flow-runs/retry` filtered on `status=PROJECT_INACTIVE`, strategy `ON_LATEST_VERSION`). Reactivation needs no republish — flipping `status` back to `ACTIVE` restores normal operation on its own.

What is blocked: production flow runs (sync and async webhooks, worker `submitPayloads`, manual trigger), run retries, agent/chat runs, and polling ticks. What is **not** blocked, deliberately: TESTING runs and user-interaction jobs (the builder stays usable), and `RENEW_WEBHOOK` (blocking renewals through a long pause would let third-party webhook registrations expire and break the project permanently on reactivation).

Read path is `projectStatusService` (`project-status.service.ts`), a 60s Redis-cached lookup modeled on `projectWorkerGroupService` and invalidated from `projectService.update` whenever `status` is in the payload. It exposes three entry points, and picking the wrong one is how TESTING accidentally gets blocked:

| Method | Use for |
|---|---|
| `shouldBlockRun({ projectId, environment })` | every run-admission site — returns `false` for any non-PRODUCTION environment before it even reads the status, mirroring `shouldBlockRunOnCredits` |
| `assertRunIsAllowed({ projectId, environment })` | the same check as a throw (retry paths) |
| `isInactive({ projectId })` | only where there is no `RunEnvironment` to reason about: the polling interceptor and the agent controllers |

### Gotchas
- `projectHooks.postCreate` is where EE creates the associated `ProjectPlan`, sets piece filters, and auto-subscribes an alert receiver (owner email for personal, `context.alertReceiverEmail` for team).
- Soft-deleted projects stay in DB; a background job hard-deletes them.
- **`status` is platform-admin-only, and silently dropped otherwise.** The `POST /v1/projects/:id` handler nulls it out unless `ownThePlatform`, exactly like `externalId` and `executionDataRetentionDays` — a project ADMIN with `WRITE_PROJECT` gets a 200 with the field ignored, not a 403. `isPlatformAdmin` counts every `SERVICE` principal on the platform, so API keys and service tokens can toggle it.
- **`EXECUTE_FLOW` jobs already in the queue when a project is deactivated still drain.** They were admitted while it was active and the interceptor deliberately leaves them alone; the exposure is the depth of that project's queue at flip time. Only `EXECUTE_POLLING` is intercepted at dispatch.
- **`projectStatusService.isInactive` is fail-open.** A Redis or DB error logs a warning and admits the run — an infra blip must not silently halt every tenant. Same posture as the credit gate.
- `status` rides on `ProjectWithLimits`, so it is readable on every project `GET` even though only platform admins can write it.

### Key files
Entry point: `projectService`, a log-taking factory in `project-service.ts` that every project read and write routes through.

- `packages/server/api/src/app/project/` — core service, TypeORM entity, repo, hooks, worker controller
- `packages/server/api/src/app/ee/projects/` — the whole `/v1/projects` HTTP surface plus members, roles, releases, plans
- `packages/core/shared/src/lib/management/project/` — `Project`, `ProjectPlan`, `ProjectIcon` and request schemas
- `packages/web/src/features/projects/components/` — project switcher, platform switcher, create and edit dialogs
- `packages/web/src/features/projects/stores/` — current-project store

Paths verified 2026-07-17. An earlier version pointed at `project/project-controller.ts`; that file is gone and the `/v1/projects` routes now register from `ee/projects/platform-project-module.ts`.
