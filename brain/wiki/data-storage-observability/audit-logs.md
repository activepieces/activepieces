---
icon: 📜
---

# Audit Logs

Records security-relevant actions for compliance and forensics, persisted to the `audit_event` table and queryable by platform admins. Enterprise/Cloud only, gated by `platform.plan.auditLogEnabled`.

### Entities & services
- **ApplicationEvent**: discriminated union of all auditable types; **ApplicationEventName** is a 27-value enum (`flow.created`, `flow.published`, `user.signed.in`, `variable.value.revealed`, etc.).
- `audit_event` entity: `action`, `userEmail`, `userId`, `projectId` (nullable), `data` (jsonb), `ip`. Composite indices on `(platformId, projectId, userId, action)` and narrower.
- `audit-event-service.ts`: `setup()` and `list()`.

### How it works
- `setup()` registers two fire-and-forget listeners on the `applicationEvents` bus — `userEvent` (user actions) and `workerEvent` (background actions) — so events are captured transparently without callers coupling to the audit code.
- `GET /v1/audit-events` (platformAdminOnly) returns `SeekPage<ApplicationEvent>` sorted by `created` desc. Filters: `action[]`, `projectId[]`, `userId`, `createdBefore/After`, cursor/limit.

### Gotchas
- Event capture is decoupled via the event bus — new auditable actions just emit onto `applicationEvents`.
- `summarizeApplicationEvent()` builds detailed summaries (e.g. for `flow.updated`). `buildMockEvent()` yields a typed mock per event name, reused by event-destination test delivery.

### Key files
Entry point: `auditLogService`, wired up in `auditEventModule` which calls `.setup()` and mounts the controller at `/v1/audit-events`.

- `packages/server/api/src/app/ee/audit-logs/` — module, service, and TypeORM entity
- `packages/core/shared/src/lib/ee/audit-events/` — event types, the `ApplicationEvent` union, `summarizeApplicationEvent()`, and `buildMockEvent()`
- `packages/web/src/features/platform-admin/api/audit-events-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/audit-log-hooks.ts` — React Query hooks
- `packages/web/src/app/routes/platform/security/audit-logs/` — platform admin UI page
- `packages/server/api/test/integration/cloud/audit-event/` — integration tests
- `docs/admin-guide/security/audit-logs/` — one user-facing doc page per event type

Paths verified 2026-07-17.
