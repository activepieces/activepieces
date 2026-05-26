# Global Connections (Platform-Wide Connections)

## Summary
Global Connections are app connections scoped to a platform rather than an individual project (`AppConnectionScope.PLATFORM`). They can be shared across multiple projects simultaneously, eliminating the need for each project to re-authenticate the same service account. A platform admin creates or updates global connections; they are then accessible to any project listed in the connection's `projectIds` array (or pre-selected for new projects if `preSelectForNewProjects` is true). Gated by `platform.plan.globalConnectionsEnabled`.

## Key Files
- `packages/server/api/src/app/ee/global-connections/global-connection-module.ts` — module + controller (no separate controller file; both are in the module file)
- `packages/server/api/src/app/ee/app-connection/app-connection-service/app-connection-service.ts` — shared connection service used by global connections (with `scope: PLATFORM`)
- `packages/shared/src/lib/` — uses existing `AppConnectionWithoutSensitiveData`, `UpsertGlobalConnectionRequestBody`, `UpdateGlobalConnectionValueRequestBody`, `ListGlobalConnectionsRequestQuery` types from shared

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.globalConnectionsEnabled`. Module hook: `platformMustHaveFeatureEnabled((platform) => platform.plan.globalConnectionsEnabled)`.

## Domain Terms
- **Global Connection**: An `AppConnection` with `scope = PLATFORM`, owned by the platform rather than a project.
- **projectIds**: Array of project IDs that can use this connection. If empty or null, the connection is not yet distributed to any project.
- **preSelectForNewProjects**: Boolean flag that auto-assigns the connection to newly created projects.
- **externalId**: Stable external identifier for the connection, useful for upsert operations from external systems.

## Endpoints

All mount under `/v1/global-connections`. All require `platformAdminOnly` (`USER` or `SERVICE` principal). All endpoints also accept service key authentication (`SERVICE_KEY_SECURITY_OPENAPI`).

| Method | Path | Auth | Response | Description |
|---|---|---|---|---|
| POST | `/v1/global-connections` | Platform admin (USER or SERVICE) | `AppConnectionWithoutSensitiveData` (201) | Upsert a global connection |
| POST | `/v1/global-connections/:id` | Platform admin (USER or SERVICE) | `AppConnectionWithoutSensitiveData` | Update metadata (displayName, projectIds) |
| GET | `/v1/global-connections` | Platform admin (USER or SERVICE) | `SeekPage<AppConnectionWithoutSensitiveData>` | List global connections for platform |
| DELETE | `/v1/global-connections/:id` | Platform admin (USER or SERVICE) | 204 No Content | Delete a global connection |

Query parameters for list: `{ displayName?, pieceName?, status?, cursor?, limit? }`.

## Service Integration

The module delegates all operations to `appConnectionService` with `scope: AppConnectionScope.PLATFORM` and `projectId: null`:

- **Upsert**: calls `appConnectionService.upsert({ ..., scope: PLATFORM, platformId })`. Fires `CONNECTION_UPSERTED` audit event.
- **Update**: calls `appConnectionService.update({ ..., scope: PLATFORM, projectId: null })`. Only updates `displayName`, `projectIds`, and `preSelectForNewProjects`.
- **List**: calls `appConnectionService.list({ ..., scope: PLATFORM, platformId, projectId: null })` then strips sensitive data.
- **Delete**: calls `appConnectionService.delete({ ..., scope: PLATFORM, projectId: null })`. Fires `CONNECTION_DELETED` audit event.

## Notes
- Global connections are stored in the same `app_connection` table as project-scoped connections; the `scope` column distinguishes them.
- When displaying global connections to project users (in the builder connection picker), the shared `appConnectionService.list` call is made with the project's ID and scope filtering handles visibility.
