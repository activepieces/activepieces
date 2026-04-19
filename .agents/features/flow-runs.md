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
- `packages/web/src/features/flow-runs/components/runs-table/` — `RunsTable`, `columns.tsx`, retry/cancel/archive dialogs
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
- **PauseMetadata**: JSONB column distinguishing DELAY pauses (scheduled resume) from WEBHOOK pauses (external callback).
- **Retry Strategy**: FROM_FAILED_STEP (resume from exact failure point, keeping prior outputs) or ON_LATEST_VERSION (fresh run on current published version).
- **Subflow**: A child run linked via `parentRunId`, created when a flow calls another flow as a step.
- **failedStep**: JSONB snapshot of `{ name, type, errorMessage }` for the step that caused failure, enabling filtered retries.

## Entity

**FlowRun**: id, projectId, flowId, flowVersionId, environment (PRODUCTION/TESTING), logsFileId (nullable FK to File), parentRunId (nullable, self-reference for subflows), failParentOnFailure (default true), status, tags[] (nullable), startTime, triggeredBy (nullable FK to User), finishTime, pauseMetadata (JSONB), failedStep (JSONB: name, type, errorMessage), archivedAt (soft delete), stepNameToTest (nullable), stepsCount.

## FlowRunStatus (12 States)

**Non-terminal**: QUEUED, RUNNING, PAUSED
**Terminal**: SUCCEEDED, FAILED, TIMEOUT, CANCELED, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED, INTERNAL_ERROR, LOG_SIZE_EXCEEDED

## Endpoints

- `GET /` — List runs (cursor pagination, filters: projectId, flowId, status, tags, createdAfter/Before, failedStepName)
- `GET /:id` — Get single run with populated data
- `POST /:id/retry` — Retry single run (strategy: FROM_FAILED_STEP or ON_LATEST_VERSION)
- `POST /retry` — Bulk retry with filters
- `POST /cancel` — Bulk cancel paused/queued runs
- `POST /archive` — Bulk soft delete (set archivedAt)
- `ALL /:id/requests/:requestId` — Resume paused webhook run with payload
- `ALL /:id/requests/:requestId/sync` — Resume and return response synchronously

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

- **DelayPauseMetadata**: `{ type: DELAY, resumeDateTime }` → BullMQ delayed job resumes at scheduled time
- **WebhookPauseMetadata**: `{ type: WEBHOOK, requestId }` → waits for HTTP callback at `/flow-runs/{id}/requests/{requestId}`
- On resume: fetch state from logs → rebuild context → re-run from paused step with `ExecutionType.RESUME`
- On server restart: `refill-paused-jobs` migration re-queues all paused runs

## Side Effects

- `onStart()` → emit FLOW_RUN_STARTED application event
- `onResume()` → emit FLOW_RUN_RESUMED
- `onFinish()` → emit FLOW_RUN_FINISHED (terminal states only), notify via WebSocket

## Frontend Integration

`flowRunsApi.subscribeToTestFlowOrManualRun()` uses Socket.IO to start a test run and stream progress updates via `WebsocketClientEvent.UPDATE_RUN_PROGRESS`. The builder's run-list sidebar polls for recent runs and the run-details panel renders step-by-step input/output from the populated run's execution logs. `flowRunMutations.useRetryRun` handles the `FLOW_RUN_RETRY_OUTSIDE_RETENTION` error code with a user-facing toast showing the retention window.
