# Audit Logging

## Summary
Audit Logging records security-relevant actions taken within a platform for compliance and forensic purposes. Events are persisted to the `audit_event` table and can be queried by platform admins with rich filtering options (user, action type, project, date range). The service registers listeners on the `applicationEvents` event bus so events are captured transparently across the codebase without coupling to callers. Gated by `platform.plan.auditLogEnabled`.

## Key Files
- `packages/server/api/src/app/ee/audit-logs/audit-event-module.ts` — module registration, sets up listeners on startup, registers `platformMustHaveFeatureEnabled` guard
- `packages/server/api/src/app/ee/audit-logs/audit-event-service.ts` — service with `setup()` and `list()` methods
- `packages/server/api/src/app/ee/audit-logs/audit-event-entity.ts` — TypeORM entity
- `packages/shared/src/lib/ee/audit-events/index.ts` — all event types, `ApplicationEvent` union, `ApplicationEventName` enum, `summarizeApplicationEvent()` helper
- `packages/shared/src/lib/ee/audit-events/mock-event-builder.ts` — `buildMockEvent()` returns a typed `ApplicationEvent` mock for every `ApplicationEventName` value (used by event destination test delivery)
- `packages/web/src/features/platform-admin/api/audit-events-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/audit-log-hooks.ts` — React query hooks
- `packages/web/src/app/routes/platform/security/audit-logs/` — platform admin UI page

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.auditLogEnabled`.

## Domain Terms
- **ApplicationEvent**: A discriminated union of all auditable event types.
- **ApplicationEventName**: Enum of 24 event action strings (e.g., `flow.created`, `flow.published`, `user.signed.in`).
- **userEvent / workerEvent**: Two listener types registered on the event bus; both persist records to `audit_event`.

## Entity

Table name: `audit_event`

| Column | Type | Notes |
|---|---|---|
| id | string | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| platformId | string | FK to `platform` (CASCADE DELETE) |
| projectId | string (nullable) | Optional project context |
| action | string | `ApplicationEventName` value |
| userEmail | string (nullable) | Actor email |
| projectDisplayName | string (nullable) | Project name at time of event |
| data | jsonb | Event-specific payload |
| ip | string (nullable) | Client IP address |
| userId | string (nullable) | Actor user ID |

Indices:
- `(platformId, projectId, userId, action)` — composite for filtered queries
- `(platformId, userId, action)`
- `(platformId, action)`

## Endpoints

Mounts under `/v1/audit-events`. Requires `platformAdminOnly` (`USER` or `SERVICE` principal).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/audit-events` | Platform admin | List events with optional filters |

Query parameters: `{ limit?, cursor?, action?, projectId?, userId?, createdBefore?, createdAfter? }`.  
`action` and `projectId` are arrays (use `OptionalArrayFromQuery`).  
Returns `SeekPage<ApplicationEvent>` sorted descending by `created`.

## Event Types

| Event Name | Description |
|---|---|
| `flow.created` | Flow created |
| `flow.deleted` | Flow deleted |
| `flow.updated` | Flow version modified (with detailed summary via `summarizeApplicationEvent`) |
| `flow.published` | Flow version published |
| `flow.activated` | Flow enabled/activated |
| `flow.deactivated` | Flow disabled/deactivated |
| `flow.run.started/finished/resumed/retried` | Flow run lifecycle |
| `folder.created/updated/deleted` | Folder management |
| `connection.upserted/deleted` | App connection changes |
| `user.signed.up/in` | Authentication events |
| `user.password.reset` | Password reset |
| `user.email.verified` | Email verification |
| `signing.key.created` | Signing key generation |
| `project.role.created/updated/deleted` | Project role changes |
| `project.release.created` | Project release |

## Service Methods

- `setup()` — registers two listeners on `applicationEvents`: one for `userEvent` (user-initiated actions), one for `workerEvent` (background worker actions). Both fire-and-forget save to the repository.
- `list({ platformId, cursorRequest, limit, userId?, action?, projectId?, createdBefore?, createdAfter? })` — paginated query filtered by `platformId` with optional additional filters.
