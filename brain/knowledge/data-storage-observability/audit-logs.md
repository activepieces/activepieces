---
icon: 📜
---

# Audit Logs

Records security-relevant actions for compliance and forensics, persisted to the `audit_event` table and queryable by platform admins. Enterprise/Cloud only, gated by `platform.plan.auditLogEnabled`.

### Entities & services
- **ApplicationEvent**: discriminated union of all auditable types; **ApplicationEventName** is a 41-value enum (`flow.created`, `flow.published`, `user.signed.in`, `variable.value.revealed`, etc.).
- `audit_event` entity: `action`, `userEmail`, `userId`, `projectId` (nullable), `data` (jsonb), `ip`. Composite indices on `(platformId, projectId, userId, action)` and narrower.
- `audit-event-service.ts`: `setup()` and `list()`.

### How it works
- `setup()` registers two fire-and-forget listeners on the `applicationEvents` bus — `userEvent` (user actions) and `workerEvent` (background actions) — so events are captured transparently without callers coupling to the audit code.
- `GET /v1/audit-events` (platformAdminOnly) returns `SeekPage<ApplicationEvent>` sorted by `created` desc, or asc with `order=ASC` (the retention dialog reads the oldest event with `order=ASC&limit=1`). Filters: `action[]`, `projectId[]`, `userId`, `createdBefore/After`, cursor/limit.

### Retention
- **Retention ceiling**: `AP_AUDIT_LOG_RETENTION_DAYS`, the instance maximum; empty keeps events forever. Read it only through `auditLogRetentionCeiling` (digits only, 30–3650, anything else is null = keep forever). Its floor matches the platform minimum, so every ceiling leaves an admin at least one period to pick.
- **Platform retention**: nullable `platform.auditLogRetentionDays`, set by a platform admin from the Audit Logs page (at least 30, at most the ceiling or 3650). The effective value is `LEAST(platform, ceiling)`; NULL with NULL skips the platform.
- `SystemJobName.AUDIT_LOG_RETENTION` runs hourly at `:15`, EE/Cloud only. One probe query lists platforms with expired rows in random order. The run then goes round those platforms, at most 100k rows per platform per round, until none has expired rows or the run reaches 1M rows or 10 minutes, so a single-platform install gets the whole budget. Each batch deletes 5000 rows oldest first with `FOR UPDATE SKIP LOCKED`, then pauses for as long as it took.
- **Pause flag**: `AP_AUDIT_LOG_RETENTION_PAUSED=true` skips the job and keeps every retention value. The ceiling cannot pause anything, because `LEAST` only shortens. The flag `AUDIT_LOG_RETENTION_PAUSED` carries it to the Retention dialog, which says the cleanup is paused.
- **Run summary**: `stoppedBy` is `done` only when no platform has expired rows left, and `failed` when every platform still left failed this run. A platform still more than `AUDIT_LOG_RETENTION_BACKLOG_GRACE_DAYS` behind its period goes into one warn line per run (worst 10).
- **Retention change event**: `audit.log.retention.updated`, sent by `platformSideEffects` from `platformService.update` only when the value changes. `previousRetentionDays` and `retentionDays` are the platform values (null = use the instance limit); `instanceLimitDays` is the ceiling at that moment, so a reader can tell "forever" from "instance limit".

### Gotchas
- Event capture is decoupled via the event bus — new auditable actions just emit onto `applicationEvents`.
- **Emit from the service that performs the operation, not from each caller.** Controller-only emission is how #14591 happened: flow events lived in `flow.controller.ts`, so all 15 MCP flow tools plus `app-connection.handler.ts`, `worker-rpc-service.ts`, `project-state-helper.ts` and `platform-teardown-jobs.ts` mutated flows and audited nothing. Flow *runs* never had that bug because `flowRunSideEffects` is called from `flow-run-service.ts`. Put the `*-side-effects.ts` hook call inside the service and default it on; where a bulk/system path genuinely wants silence (project release apply, platform teardown), give it an explicit `emitEvents: false` opt-out so the decision is reviewable instead of accidental. Request-derived `ip` is optional in the schema — pass it down from the controller as one optional param rather than keeping emission up there to preserve it.
- The list endpoint sorts by `created DESC, id DESC` — `Paginator` appends the `id` tiebreaker itself (`withIdTiebreaker`), so the index has to cover **both** columns. `(platformId, created DESC)` alone leaves an Incremental Sort node on top; `(platformId, created DESC, id DESC)` is a plain index scan. Without either, Postgres reads every row for the platform (via the `platformId`-leading `action` index) and sorts the lot to return 11, so the page 500s on statement timeout (GIT-1705). Cloud prod, Aug 2026: `audit_event` is **362M rows / 475 GB**, one platform holding ~6.5M — plan cost 7.4M, and it never finishes. The table is never pruned (GIT-1574), so any new query shape here needs an index covering the sort, not just the filter.
- Building any index on `audit_event` in prod is an operation, not a migration step: at 475 GB `CREATE INDEX CONCURRENTLY` runs for hours, and migrations run in `main.ts` *before* the server listens — so a boot-time build never reaches the healthcheck and the deploy is rolled back on top of a half-built index. Build it by hand ahead of the deploy and let the migration's `IF NOT EXISTS` no-op. `CREATE INDEX CONCURRENTLY` also obeys `statement_timeout`, so `SET statement_timeout = 0` in the psql session doing the build (and expect the boot-time path to fail outright wherever a role-level timeout is set). A CONCURRENTLY build that gets killed leaves the index present but `indisvalid = false`, where a plain `IF NOT EXISTS` retry skips it and reports success on an index the planner will never use; the 1820 migration checks `pg_index.indisvalid` and drops the invalid leftover before rebuilding, for that reason.
- Anything you read about this paginator emitting `DATE_TRUNC('second', created)` cursors is stale — it now selects `created::text` and emits a plain composite cursor `(created < c) OR (created = c AND id < i)`, so the old "events in the same second get skipped across pages" bug is gone.
- `summarizeApplicationEvent()` builds detailed summaries (e.g. for `flow.updated`). `buildMockEvent()` yields a typed mock per event name, reused by event-destination test delivery.

- **Never read the retention ceiling with `system.getNumber`.** It uses `parseInt`, so `0` reads as 0 and `1e3` as 1, and the startup validator only warns. A ceiling of 0 would delete every platform's events each hour.
- Retention deletes walk `(platformId, created DESC, id DESC)` backwards. Do not add a `created`-leading index for them; on the Cloud table that build is a manual, hours-long operation (see above).
- Each retention batch carries a keyset cursor `(created, id)` from the last row it deleted. Without it every batch re-walks the dead index entries that earlier batches left at the old end of the index until vacuum runs, which grows with the square of the rows deleted per run. The cursor is a `to_char(..., 'US')` ISO string so it keeps microseconds, and the `id` part matters: events take `created` from JS `new Date()`, so many share a millisecond.
- Each retention batch re-reads the platform's period with `SELECT ... FOR SHARE` on the platform row. The probe's value can be minutes old by the last batch, and an admin who lengthens or clears the period must not lose rows after the save returned. The share lock makes that save wait for one batch at most.
- The job sets `autovacuum_vacuum_scale_factor = 0.02` on `audit_event` the first time it has rows to delete, and only when the table has no value, so an operator's setting wins. It is not a migration: `ALTER TABLE ... SET` waits behind a running anti-wraparound vacuum, and migrations run before the healthcheck. Its `lock_timeout` is 100 ms, under the default 1 s `deadlock_timeout`, so it gives up before Postgres would cancel a running autovacuum to let it in.
- `platformService.update` reads the previous `auditLogRetentionDays` with `SELECT ... FOR UPDATE` inside the save transaction, and writes that locked value back when the request does not set the field. Otherwise two admins saving at once both report the same "before" in `audit.log.retention.updated`, and a save of any other field writes back a stale retention value. Every other platform field is still last-write-wins: the save writes the row as it was read at the start of the request. PGlite runs one connection, so the API tests cannot reproduce either race.
- Tests that need a race during a sweep (a period changed mid-run, a batch that fails) install a `BEFORE DELETE` trigger on `audit_event`; PGlite runs PL/pgSQL.
- Count deleted rows inside the statement, as `WITH deleted AS (DELETE ... RETURNING ...) SELECT count(*) OVER () ...`, not with `affected`. TypeORM fills `affected` from `rowCount`, which a PGlite result does not have. A top-level `SELECT` returns rows the same way on both drivers, where a bare `DELETE` through `em.query` does not.
- Flow-run STARTED/FINISHED events, test runs included, carry the whole `FlowRun` and are most of the rows. Retention bounds the table; it does not lower the write rate.
- Every event is saved for every platform, whatever `plan.auditLogEnabled` says. The flag gates the read endpoint and the retention setting, not capture, so only the instance ceiling cleans a platform without the feature.
- The retention job reads `platform_plan.auditLogEnabled` itself, with a `LEFT JOIN`, in the probe and in every batch. A saved period counts only while the plan has audit logs, because the API refuses every retention change (clearing included) on a plan without them, so a downgraded admin could not stop it. A platform with no plan row falls back to the ceiling. On Cloud the plan row only refreshes from Autumn when something reads the plan, so a churned platform nobody opens can keep `auditLogEnabled = true` and its saved period keeps running.
- A `DELETE` does not shrink the table file; Postgres reuses the space. A one-time shrink needs `pg_repack` or `VACUUM FULL`.
- `AP_AUDIT_LOG_RETENTION_PAUSED` is read by the app server that picks up the hourly job, and every app server runs the system-job worker. A pause set on only some servers does not stop the cleanup.
- The piece-upgrade revert (`POST /v1/admin/flows/revert-upgrade`) reads `flow.pieces.upgraded` rows, so it can only revert upgrades still inside the platform's retention period.
- A new event's docs page renders from `openapi-schema`, which resolves against `docs/openapi.json`. Nothing regenerates that file; commit its entries by hand. `z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' | 'output' })` plus `$id: '#/components/schemas/<name>[Input]'` reproduces the existing entries exactly. The four `flow.approval.*` pages point at schemas that are not in the file.

### Key files
Entry point: `auditLogService`, wired up in `auditEventModule` which calls `.setup()` and mounts the controller at `/v1/audit-events`. Retention: `auditLogRetention` (the job) and `auditLogRetentionCeiling` (the only reader of the env ceiling).

- `packages/server/api/src/app/ee/audit-logs/` — module, service, TypeORM entity, and the retention job
- `packages/server/api/src/app/helper/retention/` — the retention ceiling reader (CE, shared with the platform service and flags)
- `packages/server/api/src/app/platform/` — `platformSideEffects`, which sends the retention change event
- `packages/core/shared/src/lib/ee/audit-events/` — event types, the `ApplicationEvent` union, `summarizeApplicationEvent()`, and `buildMockEvent()`
- `packages/web/src/features/platform-admin/api/audit-events-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/audit-log-hooks.ts` — React Query hooks
- `packages/web/src/app/routes/platform/security/audit-logs/` — platform admin UI page
- `packages/web/src/features/platform-admin/` — `AuditLogRetentionButton` and `auditLogRetentionUtils`
- `packages/server/api/test/integration/cloud/audit-event/` — integration tests
- `docs/admin-guide/security/audit-logs/` — one user-facing doc page per event type

Paths verified 2026-10-01.
