---
icon: 🌐
---

# Global Connections

App connections scoped to a platform (`AppConnectionScope.PLATFORM`) rather than a single project, shared across projects so each doesn't re-authenticate the same service account. A platform admin creates them; accessible to any project in the connection's `projectIds[]` (or all new projects if `preSelectForNewProjects`). Gated by `platform.plan.globalConnectionsEnabled` (EE/Cloud only).

### Entities & services
- Stored in the same `app_connection` table as project connections; the `scope` column distinguishes them.
- Module (`global-connection-module.ts`) is controller + registration in one file; delegates everything to the shared `appConnectionService` with `scope: PLATFORM, projectId: null`.
- `projectIds`: projects allowed to use the connection; `externalId`: stable id for upserts from external systems.

### How it works
- Endpoints under `/v1/global-connections`, all `platformAdminOnly` (USER or SERVICE, also accept service-key auth):
  - `POST /` upsert (fires `CONNECTION_UPSERTED`), `POST /:id` update (displayName/projectIds/preSelectForNewProjects only), `GET /` list (strips sensitive data), `DELETE /:id` (fires `CONNECTION_DELETED`).

### Gotchas
- Module gated via `platformMustHaveFeatureEnabled((p) => p.plan.globalConnectionsEnabled)`.
- When shown to project users in the builder picker, the shared `list` call runs with the project's ID and scope filtering handles visibility.

### Key files
Entry point: `globalConnectionModule`, registered twice in `packages/server/api/src/app/app.ts` (cloud and enterprise editions).

- `packages/server/api/src/app/ee/global-connections/` — the module, controller and request schemas, all in one file
- `packages/server/api/src/app/app-connection/app-connection-service/` — shared `appConnectionService` the module delegates to with `scope: PLATFORM`
- `packages/core/shared/src/lib/automation/app-connection/dto/` — `UpsertGlobalConnectionRequestBody`, `UpdateGlobalConnectionValueRequestBody`, `ListGlobalConnectionsRequestQuery`
- `packages/core/shared/src/lib/automation/app-connection/app-connection.ts` — `AppConnectionScope`, `AppConnectionWithoutSensitiveData`
- `packages/web/src/features/connections/` — api client, hooks and the edit dialog for global connections
- `packages/server/api/test/integration/cloud/global-connection/` — endpoint integration tests

Paths verified 2026-07-17. An earlier version pointed at `packages/server/api/src/app/ee/app-connection/app-connection-service/app-connection-service.ts`; the service moved out of `ee/` to `packages/server/api/src/app/app-connection/app-connection-service/`.
