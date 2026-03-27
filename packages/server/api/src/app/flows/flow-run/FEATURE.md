# Flow Runs Module

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
