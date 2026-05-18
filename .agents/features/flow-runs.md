# Flow Runs Module

## Summary
Flow Runs records every execution of a flow, tracking its full lifecycle from queuing through completion or failure. It stores compressed execution logs for step-by-step inspection, supports pause-and-resume for delay and webhook-based waits, provides retry strategies for recovering from failures, and emits WebSocket events and application events to notify the frontend and downstream systems in real time.

## Key Files
- `packages/server/api/src/app/flows/flow-run/` — controller, service, entity
- `packages/shared/src/lib/automation/flow-run/flow-run.ts` — `FlowRun` type
- `packages/shared/src/lib/automation/flow-run/dto/` — list, retry, bulk request types
- `packages/shared/src/lib/automation/flow-run/execution/` — `StepOutput`, `FlowExecution`, `ExecutionOutput`
- `packages/shared/src/lib/automation/flow-run/log-serializer.ts` — zstd compress/decompress helpers
- `packages/web/src/features/flow-runs/api/flow-runs-api.ts` — `flowRunsApi`
- `packages/web/src/features/flow-runs/hooks/flow-run-hooks.ts` — `flowRunQueries`, `flowRunMutations`
- `packages/web/src/features/flow-runs/components/runs-table/` — `RunsTable`, `columns.tsx`, retry/cancel/archive dialogs, `failed-step-dialog.tsx`
- `packages/web/src/app/builder/flow-canvas/widgets/run-info-widget.tsx` — builder widget that jumps to the failed step on the canvas
- `packages/web/src/app/builder/state/run-state.ts` — tracks the focused/failed step for the builder
- `packages/server/api/src/app/ee/alerts/alerts-service.ts` — sends the failure email via the EE Alerts feature (see `.agents/features/alerts.md`)
- `packages/web/src/features/flow-runs/components/step-status-icon.tsx` — per-step status badge
- `packages/web/src/app/routes/runs/index.tsx` — runs list page
- `packages/web/src/app/routes/runs/id/index.tsx` — individual run detail page
- `packages/web/src/app/builder/run-details/` — step input/output inspector inside the builder
- `packages/web/src/app/builder/run-list/` — recent runs sidebar in the builder

## Edition Availability
- **Community (CE)**: Full run tracking and inspection. No retention limits beyond the server-configured `EXECUTION_DATA_RETENTION_DAYS`.
- **Enterprise (EE) / Cloud**: Same core feature. Cloud plans may enforce retention windows. Bulk retry admin endpoint (`POST /v1/admin/platforms/runs/retry`) is Cloud-only.

## Domain Terms
- **FlowRun**: A single execution instance of a specific flow version, from trigger to terminal state.
- **FlowRunStatus**: One of 12 states — 3 non-terminal (QUEUED, RUNNING, PAUSED) and 9 terminal (SUCCEEDED, FAILED, TIMEOUT, CANCELED, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED, INTERNAL_ERROR, LOG_SIZE_EXCEEDED, plus PAUSED terminal via delay).
- **LogsFile**: Zstd-compressed File entity (type FLOW_RUN_LOG) storing the full `FlowExecutorContext` after execution.
- **Waitpoint**: Row in the `waitpoint` table representing one paused step on a run. Fields: `type` (DELAY|WEBHOOK), `version` (V0|V1 — V1 is the current API), `status` (PENDING|COMPLETED), `stepName`, `resumeDateTime`, `responseToSend`, `resumePayload`, `workerHandlerId`, `httpRequestId`. Unique on `(flow_run_id, step_name)`.
- **PauseMetadata** *(legacy/V0)*: JSONB column on `flow_run` distinguishing DELAY vs WEBHOOK pauses. Deprecated 2026-04-13 (0.82.0); still read for in-flight V0 runs, scheduled for removal. V1 runs store this information on the `waitpoint` row instead.
- **Retry Strategy**: FROM_FAILED_STEP (resume from exact failure point, keeping prior outputs) or ON_LATEST_VERSION (fresh run on current published version).
- **Subflow**: A child run linked via `parentRunId`, created when a flow calls another flow as a step.
- **failedStep**: JSONB snapshot of `{ name, displayName, message? }` for the step that caused failure. Enables filtered retries, the runs-table error-message search, the failure email's "Reason" line, and the builder's jump-to-failed-step affordance. `message` is truncated via `truncateString` from `@activepieces/shared` before being persisted, and the engine populates `failedStep` for every status in `FAILED_STATES` (FAILED, TIMEOUT, INTERNAL_ERROR, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED) — not just `FAILED`.

## Entity

**FlowRun**: id, projectId, flowId, flowVersionId, environment (PRODUCTION/TESTING), logsFileId (nullable FK to File), parentRunId (nullable, self-reference for subflows), failParentOnFailure (default true), status, tags[] (nullable), startTime, triggeredBy (nullable FK to User), finishTime, pauseMetadata (JSONB), failedStep (JSONB: `{ name, displayName, message? }`), archivedAt (soft delete), stepNameToTest (nullable), stepsCount.

## FlowRunStatus (12 States)

**Non-terminal**: QUEUED, RUNNING, PAUSED
**Terminal**: SUCCEEDED, FAILED, TIMEOUT, CANCELED, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED, INTERNAL_ERROR, LOG_SIZE_EXCEEDED

## Endpoints

- `GET /` — List runs (cursor pagination, filters: projectId, flowId, status, tags, createdAfter/Before, failedStepName, failedStepMessage). `failedStepMessage` is a case-insensitive `ILIKE '%…%'` against `failedStep->>'message'`. The status and failedStepMessage filters are independent — combining a non-failure status with a failedStepMessage simply returns empty (no implicit narrowing).
- `GET /:id` — Get single run with populated data
- `POST /:id/retry` — Retry single run (strategy: FROM_FAILED_STEP or ON_LATEST_VERSION)
- `POST /retry` — Bulk retry with filters
- `POST /cancel` — Bulk cancel paused/queued runs
- `POST /archive` — Bulk soft delete (set archivedAt)
- `POST /v1/waitpoints` — Engine-only: create a waitpoint (PENDING) for a paused step
- `ALL /:id/waitpoints/:waitpointId` — Resume a paused run via waitpoint (V1, async)
- `ALL /:id/waitpoints/:waitpointId/sync` — Resume and return the flow's response synchronously (V1)
- `ALL /:id/requests/:requestId` — V0 legacy resume route (pauseMetadata-based)
- `ALL /:id/requests/:requestId/sync` — V0 legacy sync resume

## Retry Strategies

- **FROM_FAILED_STEP**: Fetches execution state from zstd-compressed logs file, rebuilds FlowExecutorContext, re-runs from failed step. Previous step outputs preserved.
- **ON_LATEST_VERSION**: Starts fresh from trigger on latest published version.
- Constraint: only terminal states, within retention window (EXECUTION_DATA_RETENTION_DAYS).

## Logs Storage

- Stored as File entities with type FLOW_RUN_LOG
- Compressed with zstd before upload
- Worker uploads via JWT-signed URLs (7-day expiry)
- State backed up every 15s during execution for crash recovery

## Pause & Resume

- **Waitpoints (V1, current):** pieces call `ctx.run.createWaitpoint({ type, ... })` + `ctx.run.waitForWaitpoint(id)`. Engine POSTs `/v1/waitpoints`; server inserts a PENDING row keyed on `(flow_run_id, step_name)`.
  - `DELAY` waitpoint: server upserts a `SystemJobName.RESUME_DELAY_WAITPOINT` BullMQ job scheduled at `resumeDateTime`. When it fires, `resumeService.resumeFromWaitpoint` enqueues the resume.
  - `WEBHOOK` waitpoint: resume signal arrives as an HTTP call on `/:id/waitpoints/:waitpointId[/sync]`. Optional `responseToSend` is replied immediately to the original webhook trigger.
- **Pre-completion (resume-before-pause race):** `waitpoint-service.complete()` takes a pessimistic write lock on the PENDING row. If no row yet, it inserts a COMPLETED row with the `resumePayload`. When the flow then transitions to PAUSED, `flow-runs-queue.ts` sees the COMPLETED waitpoint and enqueues the resume immediately. Prevents dropped early callbacks.
- **On resume:** fetch state from logs file → rebuild `FlowExecutorContext` → re-run the paused step with `ExecutionType.RESUME` and `ctx.resumePayload = waitpoint.resumePayload`.
- **Limits:** `AP_PAUSED_FLOW_TIMEOUT_DAYS` caps DELAY `resumeDateTime`; engine throws `PausedFlowTimeoutError` beyond that.
- **Legacy (V0) path:** `pauseMetadata` on `flow_run` + `ctx.run.pause({ pauseMetadata })` + `ctx.generateResumeUrl()` + `/requests/:requestId[/sync]` routes. Still functional for in-flight runs; scheduled for removal.
- **On server restart:** `refill-paused-jobs` migration re-queues legacy paused runs. Waitpoint DELAYs are BullMQ delayed jobs and survive restarts natively.

## Side Effects

- `onStart()` → emit FLOW_RUN_STARTED application event
- `onResume()` → emit FLOW_RUN_RESUMED
- `onFinish()` → emit FLOW_RUN_FINISHED (terminal states only), notify via WebSocket

## Frontend Integration

`flowRunsApi.subscribeToTestFlowOrManualRun()` uses Socket.IO to start a test run and stream progress updates via `WebsocketClientEvent.UPDATE_RUN_PROGRESS`. The builder's run-list sidebar polls for recent runs and the run-details panel renders step-by-step input/output from the populated run's execution logs. `flowRunMutations.useRetryRun` handles the `FLOW_RUN_RETRY_OUTSIDE_RETENTION` error code with a user-facing toast showing the retention window.

### Runs Table Filters

The runs table surfaces a Status multi-select and an "Error message" text input (`failedStepMessage` URL param). Filters are independent AND'd dimensions — the backend applies them with no implicit narrowing. Combining a non-failure status with `failedStepMessage` returns empty (only `FAILED_STATES` runs carry `failedStep.message`); the conflict is left for the user to resolve via the visible chips.

### Failed-Step Surfaces

- **Runs table failed-step column** renders the failed step's display name with a tooltip showing the truncated, JSON-pretty error message; clicking opens `FailedStepDialog` (full error + "Go to run" footer). Legacy runs without a captured message bypass the dialog and navigate straight to the run page.
- **Builder run-info widget** shows a "Jump to failed step" button that focuses the failed step on the canvas using `run-state` to track the focused step.
