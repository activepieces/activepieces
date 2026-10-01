---
icon: 📜
---

# Audit Logs

Records security-relevant actions for compliance and forensics, persisted to the `audit_event` table and queryable by platform admins. Enterprise/Cloud only, gated by `platform.plan.auditLogEnabled`.

### Entities & services
- **ApplicationEvent**: discriminated union of all auditable types; **ApplicationEventName** is a 40-value enum (`flow.created`, `flow.published`, `user.signed.in`, `variable.value.revealed`, etc.).
- `audit_event` entity: `action`, `userEmail`, `userId`, `projectId` (nullable), `data` (jsonb), `ip`. Composite indices on `(platformId, projectId, userId, action)` and narrower.
- `audit-event-service.ts`: `setup()` and `list()`.

### How it works
- `setup()` registers two fire-and-forget listeners on the `applicationEvents` bus — `userEvent` (user actions) and `workerEvent` (background actions) — so events are captured transparently without callers coupling to the audit code.
- `GET /v1/audit-events` (platformAdminOnly) returns `SeekPage<ApplicationEvent>` sorted by `created` desc. Filters: `action[]`, `projectId[]`, `userId`, `createdBefore/After`, cursor/limit.

### Retention
- **Retention ceiling**: `AP_AUDIT_LOG_RETENTION_DAYS`, the instance maximum; empty keeps events forever. Read it only through `auditLogRetentionCeiling` (digits only, 1–3650, anything else is null = keep forever).
- **Platform retention**: nullable `platform.auditLogRetentionDays`, set by a platform admin from the Audit Logs page (at least 30, at most the ceiling or 3650). The effective value is `LEAST(platform, ceiling)`; NULL with NULL skips the platform.
- `SystemJobName.AUDIT_LOG_RETENTION` runs hourly at `:15`, EE/Cloud only. One probe query lists platforms with expired rows in random order, then each platform is deleted oldest first in 5000-row `FOR UPDATE SKIP LOCKED` batches, capped at 100k rows per platform and 1M rows or 10 minutes per run.

### Gotchas
- Event capture is decoupled via the event bus — new auditable actions just emit onto `applicationEvents`.
- **Emit from the service that performs the operation, not from each caller.** Controller-only emission is how #14591 happened: flow events lived in `flow.controller.ts`, so all 15 MCP flow tools plus `app-connection.handler.ts`, `worker-rpc-service.ts`, `project-state-helper.ts` and `platform-teardown-jobs.ts` mutated flows and audited nothing. Flow *runs* never had that bug because `flowRunSideEffects` is called from `flow-run-service.ts`. Put the `*-side-effects.ts` hook call inside the service and default it on; where a bulk/system path genuinely wants silence (project release apply, platform teardown), give it an explicit `emitEvents: false` opt-out so the decision is reviewable instead of accidental. Request-derived `ip` is optional in the schema — pass it down from the controller as one optional param rather than keeping emission up there to preserve it.
- The list endpoint sorts by `created DESC, id DESC` — `Paginator` appends the `id` tiebreaker itself (`withIdTiebreaker`), so the index has to cover **both** columns. `(platformId, created DESC)` alone leaves an Incremental Sort node on top; `(platformId, created DESC, id DESC)` is a plain index scan. Without either, Postgres reads every row for the platform (via the `platformId`-leading `action` index) and sorts the lot to return 11, so the page 500s on statement timeout (GIT-1705). Cloud prod, Aug 2026: `audit_event` is **362M rows / 475 GB**, one platform holding ~6.5M — plan cost 7.4M, and it never finishes. The table is never pruned (GIT-1574), so any new query shape here needs an index covering the sort, not just the filter.
- Building any index on `audit_event` in prod is an operation, not a migration step: at 475 GB `CREATE INDEX CONCURRENTLY` runs for hours, and migrations run in `main.ts` *before* the server listens — so a boot-time build never reaches the healthcheck and the deploy is rolled back on top of a half-built index. Build it by hand ahead of the deploy and let the migration's `IF NOT EXISTS` no-op. `CREATE INDEX CONCURRENTLY` also obeys `statement_timeout`, so `SET statement_timeout = 0` in the psql session doing the build (and expect the boot-time path to fail outright wherever a role-level timeout is set). A CONCURRENTLY build that gets killed leaves the index present but `indisvalid = false`, where a plain `IF NOT EXISTS` retry skips it and reports success on an index the planner will never use; the 1820 migration checks `pg_index.indisvalid` and drops the invalid leftover before rebuilding, for that reason.
- Anything you read about this paginator emitting `DATE_TRUNC('second', created)` cursors is stale — it now selects `created::text` and emits a plain composite cursor `(created < c) OR (created = c AND id < i)`, so the old "events in the same second get skipped across pages" bug is gone.
- `summarizeApplicationEvent()` builds detailed summaries (e.g. for `flow.updated`). `buildMockEvent()` yields a typed mock per event name, reused by event-destination test delivery.

- **Never read the retention ceiling with `system.getNumber`.** It uses `parseInt`, so `0` reads as 0 and `1e3` as 1, and the startup validator only warns. A ceiling of 0 would delete every platform's events each hour.
- Retention deletes walk `(platformId, created DESC, id DESC)` backwards. Do not add a `created`-leading index for them; on the Cloud table that build is a manual, hours-long operation (see above).
- Count deleted rows with `.returning('id')` and the length of `result.raw`, not `affected`. TypeORM fills `affected` from `rowCount`, which a PGlite result does not have, so it is undefined in the API tests.
- Flow-run STARTED/FINISHED events, test runs included, carry the whole `FlowRun` and are most of the rows. Retention bounds the table; it does not lower the write rate.
- Every event is saved for every platform, whatever `plan.auditLogEnabled` says. The flag gates the read endpoint and the retention setting, not capture, so only the instance ceiling cleans a platform without the feature.
- A `DELETE` does not shrink the table file; Postgres reuses the space. A one-time shrink needs `pg_repack` or `VACUUM FULL`.
- The piece-upgrade revert (`POST /v1/admin/flows/revert-upgrade`) reads `flow.pieces.upgraded` rows, so it can only revert upgrades still inside the platform's retention period.

### Key files
Entry point: `auditLogService`, wired up in `auditEventModule` which calls `.setup()` and mounts the controller at `/v1/audit-events`. Retention: `auditLogRetention` (the job) and `auditLogRetentionCeiling` (the only reader of the env ceiling).

- `packages/server/api/src/app/ee/audit-logs/` — module, service, TypeORM entity, and the retention job
- `packages/server/api/src/app/helper/retention/` — the retention ceiling reader (CE, shared with the platform service and flags)
- `packages/core/shared/src/lib/ee/audit-events/` — event types, the `ApplicationEvent` union, `summarizeApplicationEvent()`, and `buildMockEvent()`
- `packages/web/src/features/platform-admin/api/audit-events-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/audit-log-hooks.ts` — React Query hooks
- `packages/web/src/app/routes/platform/security/audit-logs/` — platform admin UI page
- `packages/web/src/features/platform-admin/` — `AuditLogRetentionButton` and `auditLogRetentionUtils`
- `packages/server/api/test/integration/cloud/audit-event/` — integration tests
- `docs/admin-guide/security/audit-logs/` — one user-facing doc page per event type

Paths verified 2026-09-30.
