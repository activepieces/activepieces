---
icon: 🏃
---

# Flow Runs

A Flow Run records one execution of a specific flow version, from trigger to terminal state. It stores compressed step-by-step logs, supports pause/resume for delay and webhook waits, offers retry strategies, and emits WebSocket + application events for real-time UI.

### Entities & services
- **FlowRun** — id, projectId, flowId, flowVersionId, environment (PRODUCTION/TESTING), status, logsFileId, parentRunId (subflows), failedStep (JSONB `{name, displayName, message?}`), timeline (JSONB), archivedAt (soft delete).
- **12 statuses**: 3 non-terminal (QUEUED, RUNNING, PAUSED) + 9 terminal (SUCCEEDED, FAILED, TIMEOUT, CANCELED, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED, INTERNAL_ERROR, LOG_SIZE_EXCEEDED).
- **Waitpoint** — row per paused step: `type` (DELAY|WEBHOOK), `version` (V0|V1), `status` (PENDING|COMPLETED), unique on `(flow_run_id, step_name)`.
- **LogsFile** — zstd-compressed File (type FLOW_RUN_LOG) holding the full executor context.

### How it works
- **Endpoints**: `GET /` (cursor paginated by composite `(created DESC, id DESC)`, filters incl. `failedStepMessage` ILIKE), `GET /:id`, `POST /:id/retry`, `POST /retry|cancel|archive` (bulk), waitpoint resume routes.
- **Retry strategies**: `FROM_FAILED_STEP` (rebuild context from logs, re-run from failure, prior outputs kept) or `ON_LATEST_VERSION` (fresh run on current published version). Both resolve the trigger payload via `resolveStepOutput`. If the trigger itself failed, they switch to `executeTrigger: true` to reprocess the raw event.
- **Pause/resume (V1 waitpoints)**: pieces call `createWaitpoint` + `waitForWaitpoint`. DELAY upserts a `RESUME_DELAY_WAITPOINT` BullMQ job; WEBHOOK resumes on an HTTP call to `/:id/waitpoints/:waitpointId[/sync]`.
- Logs backed up every 15s during execution for crash recovery; uploaded via 7-day JWT-signed URLs.
- **RUN_TELEMETRY job**: `flow-run-module.ts` registers a BullMQ system job (cron `50 23 * * *`, once daily at 23:50 UTC) that aggregates the day's run counts by `(projectId, flowId, environment)` in one transaction (5-minute statement timeout) and emits a `FLOW_RUN_CREATED` telemetry event per group. No-op when telemetry is disabled. The cron was `0/50 23 * * *` until GIT-1632, which also fired at 23:00 with partial counts.

### Gotchas
- **Resume Confirmation Page (scanner guard)**: the `/confirm` route serves an HTML Approve/Disapprove page on `GET`/`HEAD` (never consumes) and only resumes on `POST` — stops email security scanners (Safe Links, Mimecast, Proofpoint) prefetching approval links. The deprecated bare `GET /:id/waitpoints/:waitpointId` still resumes for old emails. Slack is unchanged (server-side POST from webhook).
- **ResumeReason** (`WAITPOINT`|`RETRY`) discriminates whether FAILED steps are restored on resume: waitpoint resumes preserve them, retry resumes drop them so the failed step re-executes.
- **Failed-trigger payload** survives past BullMQ job completion only because `buildFailedTriggerContext` writes it into the trigger step's `output` slot.
- **Big step outputs**: over 32 KB inline → stored as a `LogSliceRef` pointer to a `FLOW_RUN_LOG_SLICE` file (`outputType === SLICE`); missing backing file throws `ENTITY_NOT_FOUND` (loud retry failure). Step *inputs* over 2 KB (`AP_FLOW_RUN_LOG_INPUT_TRUNCATE_THRESHOLD_KB`) become a display-only truncation placeholder.
- Retries only allowed on terminal states within `EXECUTION_DATA_RETENTION_DAYS`.
- **AI usage billing**: on terminal runs (paid editions), `aiUsageTracker` walks step outputs and emits `AI_USAGE_PER_RUN` to PostHog, wrapped in tryCatch so it never breaks run completion.

### Editions
CE has full run tracking. Cloud may enforce retention windows; bulk-retry admin endpoint is Cloud-only.

### Key files
Entry point: `flowRunService`, defined in `flow-run-service.ts` and wired through `flow-run-module.ts`.

- `packages/server/api/src/app/flows/flow-run/` — controller, service, entity, hooks, side effects, runs queue, AI usage extractor/tracker
- `packages/server/api/src/app/flows/flow-run/waitpoint/` — resume routes, the `/confirm` page, and its theme hooks
- `packages/core/execution/src/lib/flow-run/` — `FlowRun` type, request dtos, execution types (`StepOutput`, `FlowExecution`), zstd log serializer
- `packages/server/engine/src/lib/helper/logging-utils.ts` — produces the truncated-input placeholder the web run-details tab detects
- `packages/server/api/src/app/ee/flow-run-tracking/` — daily EE job emitting the per-platform run count
- `packages/web/src/features/flow-runs/` — `flowRunsApi`, run query/mutation hooks, runs table and its dialogs
- `packages/web/src/app/routes/runs/` — runs list and run detail pages
- `packages/web/src/app/builder/run-details/` — step input/output inspector inside the builder
- `packages/web/src/app/builder/run-list/` — recent runs sidebar in the builder
- `packages/web/src/app/builder/state/` — run state and canvas state, including live-follow control

Paths verified 2026-07-17. An earlier version pointed at `packages/core/shared/src/lib/automation/flow-run/`; it moved to `packages/core/execution/src/lib/flow-run/`.
