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
- **Emit from the service that performs the operation, not from each caller.** Controller-only emission is how #14591 happened: flow events lived in `flow.controller.ts`, so all 15 MCP flow tools plus `app-connection.handler.ts`, `worker-rpc-service.ts`, `project-state-helper.ts` and `platform-teardown-jobs.ts` mutated flows and audited nothing. Flow *runs* never had that bug because `flowRunSideEffects` is called from `flow-run-service.ts`. Put the `*-side-effects.ts` hook call inside the service and default it on; where a bulk/system path genuinely wants silence (project release apply, platform teardown), give it an explicit `emitEvents: false` opt-out so the decision is reviewable instead of accidental. Request-derived `ip` is optional in the schema — pass it down from the controller as one optional param rather than keeping emission up there to preserve it.
- The list endpoint sorts by `created DESC, id DESC` — `Paginator` appends the `id` tiebreaker itself (`withIdTiebreaker`), so the index has to cover **both** columns. `(platformId, created DESC)` alone leaves an Incremental Sort node on top; `(platformId, created DESC, id DESC)` is a plain index scan. Without either, Postgres reads every row for the platform (via the `platformId`-leading `action` index) and sorts the lot to return 11, so the page 500s on statement timeout (GIT-1705). Cloud prod, Aug 2026: `audit_event` is **362M rows / 475 GB**, one platform holding ~6.5M — plan cost 7.4M, and it never finishes. The table is never pruned (GIT-1574), so any new query shape here needs an index covering the sort, not just the filter.
- Building any index on `audit_event` in prod is an operation, not a migration step: at 475 GB `CREATE INDEX CONCURRENTLY` runs for hours, and migrations run in `main.ts` *before* the server listens — so a boot-time build never reaches the healthcheck and the deploy is rolled back on top of a half-built index. Build it by hand ahead of the deploy and let the migration's `IF NOT EXISTS` no-op. `CREATE INDEX CONCURRENTLY` also obeys `statement_timeout`, so `SET statement_timeout = 0` in the psql session doing the build (and expect the boot-time path to fail outright wherever a role-level timeout is set). A CONCURRENTLY build that gets killed leaves the index present but `indisvalid = false`, where a plain `IF NOT EXISTS` retry skips it and reports success on an index the planner will never use; the 1820 migration checks `pg_index.indisvalid` and drops the invalid leftover before rebuilding, for that reason.
- Anything you read about this paginator emitting `DATE_TRUNC('second', created)` cursors is stale — it now selects `created::text` and emits a plain composite cursor `(created < c) OR (created = c AND id < i)`, so the old "events in the same second get skipped across pages" bug is gone.
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
