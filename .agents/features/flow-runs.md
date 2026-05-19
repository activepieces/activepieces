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
- `packages/web/src/app/builder/state/canvas-state.ts` — tracks `userManuallySelectedStepDuringRun` and exposes the `resumeLiveFollow` action for live-follow control
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
- **Retry Strategy**: FROM_FAILED_STEP (resume from exact failure point, keeping prior outputs — but if the trigger itself failed, restart with BEGIN + `executeTrigger: true` since there is nothing to resume from) or ON_LATEST_VERSION (fresh run on current published version, re-runs the trigger when the previous attempt's trigger failed).
- **ResumeReason**: `WAITPOINT` | `RETRY`. Set on every `ExecutionType.RESUME` engine operation and threaded through `ExecuteFlowJobData`. Determines whether the engine restores FAILED steps from the journal — waitpoint resumes preserve them, retry resumes drop them so the failed step re-executes. The two resume paths share the same `ExecutionType`, so this field is the only discriminator.
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

- **FROM_FAILED_STEP**: Default path fetches execution state from zstd-compressed logs file, rebuilds FlowExecutorContext, re-runs from failed step. Previous step outputs preserved. Enqueued with `executionType: RESUME` and `resumeReason: RETRY` so the engine drops the FAILED step from the restored journal — without this, the failed step would be treated as already-complete and the retry would be a no-op. **Special case — failed trigger:** when `oldFlowRun.steps[trigger.name].status === FAILED`, there is nothing to RESUME from (the trigger never produced an output). The retry instead enqueues `executionType: BEGIN` + `executeTrigger: true` and feeds the raw event preserved on the trigger step's `input` field back as `triggerPayload` so `pieceTrigger.run()` re-executes against the (now-fixed) connection. Same `flowVersionId` as the original run.
- **ON_LATEST_VERSION**: Starts fresh from trigger on latest published version. Normally `executeTrigger: false` — the previous trigger output is reused via `triggerStep.output`. When the previous run's trigger step is FAILED, switches to `executeTrigger: true` and uses `triggerStep.input` (the preserved raw event) as the payload so the trigger code re-runs and produces correctly-shaped output for downstream actions.
- **Failed-trigger payload preservation**: `flow.operation.ts#buildFailedTriggerContext` writes `input.triggerPayload ?? {}` into the failed trigger step's `input` field (instead of `{}`). This is the only place the raw event survives past the BullMQ job's completion — the job is removed on `removeOnComplete: true`, so without this both retry strategies would have no event to re-trigger from.
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
- **On resume:** fetch state from logs file → rebuild `FlowExecutorContext` → re-run the paused step with `ExecutionType.RESUME` and `ctx.resumePayload = waitpoint.resumePayload`. When rebuilding `flowContext` in `flow.operation.ts#getFlowExecutionState`, steps in `SUCCEEDED` / `PAUSED` are always restored; `FAILED` steps are restored iff `resumeReason === WAITPOINT`. Dropping a FAILED step kept alive by `continueOnFailure` would re-execute it from BEGIN — re-firing its waitpoint (e.g. re-invoking a subflow) and letting the global `constants.resumePayload` pollute the new output. The retry path needs the opposite behavior, hence the discriminator.
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
- **Builder run-info widget** shows up to two controls during a run:
  - A "Follow run updates" button — visible only while the run is non-terminal and the user has manually selected a different step. Clicking it calls `resumeLiveFollow`, which clears the `userManuallySelectedStepDuringRun` flag and snaps loop indexes to their latest iteration so the canvas resumes following the engine live.
  - On failure, a "See error" button that focuses the failed step on the canvas via `goToFailedStep` in `run-state`.
  - Live-follow itself is gated by `userManuallySelectedStepDuringRun` in `canvas-state`: `selectStepByName` sets it whenever the user picks a different step mid-run (`fromAutoFocus` is passed when the change came from the auto-follow effect, not a user click), and `setRun` resets it when a new run id arrives.
