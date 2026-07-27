---
icon: 💾
---

# Data, Storage & Observability

How Activepieces stores data, secrets, files, and how it surfaces platform activity. One section per subsystem.

### Tables
Built-in relational store (no external DB needed) — typed fields, cell-level values, spreadsheet UI. Entities: `Table`, `Field` (TEXT/NUMBER/DATE/STATIC_DROPDOWN), `Record`, `Cell`, `TableWebhook`. `table.service.ts` + `record-side-effects.ts`. All CE/EE/Cloud. Gotchas: record filtering is in-memory, missing cell = `''` (so NEQ/NOT_EXISTS match unset columns); routes need `securityAccess.project(..., permission)` — passing `undefined` skips RBAC. Integrates with flows via the Tables piece (triggers register/delete a TableWebhook).

### Store Entry (key-value)
Backend-only persistent KV cache for piece steps during execution — no UI. Project-scoped, `jsonb` value, upsert on `(projectId, key)`. Key ≤128 chars, value ≤512KB (413 if over). All 3 endpoints are `securityAccess.engine()` only; projectId comes from the engine principal. Pieces use `storage.get/put/delete`. No list endpoint — opaque cache, not queryable.

### Variables
Project-scoped encrypted secrets referenced in flows as `{{variables['NAME']}}`. Separate `variable` table (not app_connection). AES-256-CBC at rest; plaintext only via reveal endpoint (USER-only, audit-logged `VARIABLE_VALUE_REVEALED`) or the engine-only `/v1/worker/variables/:name`. Perms: READ/WRITE_VARIABLE. Gotcha: the create dialog value field is deliberately `type="text"` + CSS masking, not `type="password"` — avoids Chrome's breach-check popup and password-manager save (GIT-1619).

### File Storage
Central binary persistence with two backends: DB (`bytea`) or S3-compatible (AWS/R2/MinIO/OCI). `FileType` decides location + retention — expiring execution files (logs, step files, payloads) follow `FILE_STORAGE_LOCATION`; non-expiring files (assets, avatars, releases) always DB. Optional Zstd compression, transparent on read. Hourly cleanup job deletes stale execution files past `EXECUTION_DATA_RETENTION_DAYS`. `FLOW_BUNDLE` is the one non-expiring type that's configurable (S3 signed URLs let workers fetch directly). Step files download via short-lived JWT. Files reach pieces in two shapes: **ApFile** (buffered `Buffer` + `base64`, from a plain `Property.File()`) and **ApStreamingFile** (`{ filename, extension?, size?, body: Readable }`, from `Property.File({ streaming: true })`) — a one-shot lazy file the engine never buffers, for uploading large files out to an external service.

### Secret Managers (EE)
Resolve flow/connection secrets from external vaults (HashiCorp, AWS Secrets Manager, CyberArk Conjur, 1Password) instead of the DB. Reference syntax `{{connectionId|path}}`. Config encrypted at rest, secrets + connection status cached in Redis. Scope PLATFORM or PROJECT (projectIds `@>` containment). Gated by `platform.plan.secretManagersEnabled`. EE/Cloud only.

### Audit Logs (EE)
Security-relevant actions persisted to `audit_event`, queryable by platform admins (filter user/action/project/date). Captured transparently via listeners on the `applicationEvents` bus (userEvent + workerEvent) — no caller coupling. 27 `ApplicationEventName` values (flow CRUD/lifecycle, run lifecycle, auth, connections, roles, releases). Gated by `platform.plan.auditLogEnabled`. EE/Cloud only.

### Analytics / Impact (EE)
Platform reporting: daily runs, active flows/users, time-saved estimates. `PlatformAnalyticsReport` cached (5-min TTL) refreshed under a distributed lock; separate daily cron (12:00 UTC) tallies per-piece usage into `pieceMetadata.usage`. minutesSaved = runs × flow.timeSavedPerRun. Powers `/impact` (Summary/Trends/Details). Gated by `analyticsEnabled` — NOT in CE. Frontend queries carry `enabled: platform.plan.analyticsEnabled`.

### Flow Failure Alerts (EE)
Email on flow-run failure. First failure per flowVersion per 24h window sends; rest suppressed via Redis counter `flow_fail_count:<flowVersionId>` (1-day TTL). Personal projects: single owner-only receiver toggle; team projects: any number of receivers. Platform admins can bulk sub/unsub across projects (max 5 concurrent). Receivers stored/compared lowercase. Edition check (`paidEditions`) in service, no plan flag. No Issues feature — email links straight to the run page. EE/Cloud only.

### Event Destinations (EE)
Streams platform/project events to webhook URLs in real time — internal AP flow webhooks are valid targets (route into a flow, fan out to Slack/Gmail/Teams). Subscribes to a subset of the 27 `ApplicationEventName` events. Delivery via BullMQ (`EVENT_DESTINATION` job) over `safeHttp` for external URLs; same-origin handler-flow URLs skip BullMQ and dispatch through `webhookService.handleWebhook` (no outbound HTTP, dodges SSRF self-call, GIT-1539). Server-side cycle guard prevents recursion. Gated by `auditLogEnabled` (shares audit gating); lives under the Observability sidebar group. Frontend uses a TanStack DB live collection, not React Query.

### Benchmark CLI
`activepieces benchmark` load-tests the sync-webhook path and attributes latency to queue-wait vs service-time. Auto-discovers deployment shape (`GET /v1/worker-machines`) and drives load = execution slots (so a healthy deploy shows ~zero queue-wait; any reported queue-wait is a real finding). Authoritative latency is server/worker-measured (`FlowRun.timeline` QUEUE/PROVISION/BOOT/RUN + `/v1/health/diagnostics` in-region DB/Redis/S3 RTT); client-side numbers are observational only (cross-region). Auth via platform API key. Infra-diagnostics block is self-hosted only (`FEATURE_DISABLED` on Cloud). New App Instance Registry: apps self-register into Redis `appMachines` on their snapshot tick (no inbound healthcheck), kept separate from worker slots.

## Pages

- **Tables** — Field / Record / Cell and TableWebhooks
- **File Storage** — blobs in S3 or DB, compression, expiry
- **Key-Value Store** — project-scoped state pieces persist across runs
- **Knowledge Base** — documents chunked into vector embeddings for AI search
- **Analytics** — usage reporting
- **Audit Logs** — the persisted security-action record
