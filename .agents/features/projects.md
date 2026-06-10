# CE Project Management

## Summary
A Project is the workspace within a platform where flows, connections, tables, and other resources live. Every platform has at least one project. Projects are always scoped to a platform via `platformId`. The Community edition allows a single user to have one personal project; the EE platform-projects module extends this with team projects, per-project limits, and an admin list API. Projects support soft-delete (via `deleted` timestamp), icon customization, concurrency pool assignment, and optional release management.

## Key Files
- `packages/server/api/src/app/project/project-controller.ts` — GET `/:id`, GET `/`, POST `/:id` routes (CE level)
- `packages/server/api/src/app/project/project-service.ts` — core service: `create`, `update`, `getOne`, `getOneOrThrow`, `getAllForUser`, `getUserProjectOrThrow`
- `packages/server/api/src/app/project/project-entity.ts` — `project` TypeORM entity with all relations
- `packages/server/api/src/app/project/project-repo.ts` — `repoFactory` wrapper with optional `EntityManager` support
- `packages/server/api/src/app/project/project-hooks.ts` — `hooksFactory` hook point for EE post-create behavior
- `packages/server/api/src/app/project/project-worker-controller.ts` — internal endpoint used by engine to read project data
- `packages/shared/src/lib/management/project/project.ts` — `Project`, `ProjectPlan`, `ProjectIcon`, `UpdateProjectRequestInCommunity` schemas
- `packages/web/src/features/projects/components/projects-selector.tsx` — project-switcher dropdown in the sidebar
- `packages/web/src/features/projects/components/platform-switcher.tsx` — platform-level switcher component
- `packages/web/src/features/projects/stores/project-collection.ts` — Zustand store for current project

## Edition Availability
All editions. The CE controller exposes a minimal set: get, list (returns only the personal project), and update display name/metadata. EE adds `ee-projects` module with `platformProjectService` for full admin CRUD, project limits, and per-project piece filters.

## Domain Terms
- **ProjectType** — `PERSONAL` (auto-created on sign-up, one per user per platform) or `TEAM` (EE multi-member workspace)
- **ProjectIcon** — `{ color: ColorName }` stored as JSONB; color chosen from a 12-color palette
- **externalId** — optional opaque string for embedding integrations to map projects to their own IDs
- **releasesEnabled** — feature flag per-project for the project-releases module
- **poolId** — optional FK to a `concurrency_pool` for worker concurrency limiting
- **maxConcurrentJobs** — optional per-project override for concurrent execution limit

## Entity

### `project` (`ProjectEntity`)
| Column | Type | Notes |
|---|---|---|
| id | string | ApId |
| ownerId | string | FK to `user` |
| platformId | string | FK to `platform` |
| displayName | string | |
| type | string | `ProjectType` enum |
| icon | jsonb | `{ color: ColorName }` |
| externalId | string (nullable) | embedding integration ID |
| maxConcurrentJobs | number (nullable) | concurrency cap |
| releasesEnabled | boolean | default false |
| metadata | jsonb (nullable) | arbitrary key-value |
| poolId | string (nullable) | FK to `concurrency_pool` |
| deleted | timestamp (nullable) | soft-delete date |

Indices: `ownerId`, `platformId`, `poolId`, unique `(platformId, externalId)` where `deleted IS NULL`.

Relations (one-to-many): `flows`, `files`, `folders`, `events`, `appConnections`, `tables`, `fields`, `records`, `cells`, `tableWebhooks`.

## Endpoints

| Method | Path | Security | Description |
|---|---|---|---|
| GET | `/v1/projects` | publicPlatform (USER) | List projects accessible to the current user (CE: returns personal project only) |
| GET | `/v1/projects/:id` | project scoped (USER, PARAM) | Get a single project by ID |
| POST | `/v1/projects/:id` | publicPlatform (USER, SERVICE) | Update project display name and metadata |

## Service Methods

### `projectService`
- `create({ displayName, ownerId, platformId, type, callPostCreateHooks?, postCreateContext?, entityManager? })` — creates project record with random icon color, calls `projectHooks.postCreate(savedProject, postCreateContext)` if enabled. `postCreateContext: ProjectPostCreateContext` carries side-effect inputs forwarded to the EE hook (currently `alertReceiverEmail?: string | null` for auto-subscribing an alert receiver on team projects).
- `update(projectId, request, entityManager?)` — updates allowed fields; TEAM projects allow `displayName` and `icon` update; PERSONAL projects do not
- `getOne(projectId)` / `getOneOrThrow(projectId)` — single project fetch
- `getAllForUser({ platformId, userId, isPrivileged })` — returns all projects visible to a user (admins see all platform projects, members see their assigned projects)
- `getUserProjectOrThrow(userId)` — returns the personal project owned by the user; used in CE list endpoint
- `getProjectIdsByPlatform(platformId)` — returns all project IDs for a platform; used during platform deletion
- `countByPlatformIdAndType(platformId, type)` — used to enforce project limits

## Side Effects
- Creating a project calls `projectHooks.postCreate(project, context?)`, which in EE creates an associated `ProjectPlan`, sets piece filters, and (per [alerts.md](./alerts.md)) auto-subscribes an alert receiver: the owner's email for personal projects, or `context.alertReceiverEmail` for team projects.
- Soft-deleted projects remain in DB and can be hard-deleted by a background job
