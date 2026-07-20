# Flow Runs Module

## Summary
Flow Runs records every execution of a flow, tracking its full lifecycle from queuing through completion or failure. It stores compressed execution logs for step-by-step inspection, supports pause-and-resume for delay and webhook-based waits, provides retry strategies for recovering from failures, and emits WebSocket events and application events to notify the frontend and downstream systems in real time.

## Key Files
- `packages/server/api/src/app/flows/flow-run/` — controller, service, entity
- `packages/server/api/src/app/flows/flow-run/waitpoint/resume-controller.ts` — resume routes. Deprecated `/:id/waitpoints/:waitpointId` still resumes on a bare `GET` (kept for old emails); the new `/:id/waitpoints/:waitpointId/confirm` route serves the Resume Confirmation Page on `GET`/`HEAD` (never consumes) and only resumes on `POST`, content-negotiating its response by `Accept`
- `packages/server/api/src/app/flows/flow-run/waitpoint/resume-page-hooks.ts` — CE-safe `hooksFactory` theme hook for the confirmation page (CE → `defaultTheme`; EE/Cloud `.set()` in `app.ts` → `appearanceHelper.getTheme`)
- Approval pieces that link to the `/confirm` page via a single "Review & Respond" button (`${waitpoint.resumeUrl}/confirm`, extra context params like Telegram's `chat_id` appended and preserved through to resume): `gmail/.../request-approval-in-email.ts`, `microsoft-outlook/.../request-approval-send-email.ts` (email), and `telegram-bot`, `discord`, `microsoft-teams` request-approval actions (browser `url:` buttons). **Slack is intentionally unchanged** — its buttons are interactive (`action_id`/`value`) and resume via a server-side `POST` from the Slack webhook (`slack/src/index.ts`), so it is not browser-GET-prefetchable.
- `packages/server/api/src/app/flows/flow-run/ai-usage-extractor.ts` — pure extractor that walks a finished run's step outputs and counts AI-piece usage (messages + agent tool calls) grouped per provider/model
- `packages/server/api/src/app/flows/flow-run/ai-usage-tracker.ts` — orchestrates extraction and emits the `ai_usage_per_run` PostHog billing event (see Side Effects → AI Usage Billing)
- `packages/server/api/src/app/helper/telemetry.utils.ts` — `captureBillingEvent` (PostHog capture keyed by license key) + `BillingEvents` enum
- `packages/core/shared/src/lib/automation/flow-run/flow-run.ts` — `FlowRun` type
- `packages/core/shared/src/lib/automation/flow-run/dto/` — list, retry, bulk request types
- `packages/core/shared/src/lib/automation/flow-run/execution/` — `StepOutput`, `FlowExecution`, `ExecutionOutput`
- `packages/core/shared/src/lib/automation/flow-run/log-serializer.ts` — zstd compress/decompress helpers
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

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **FlowRun**: A single execution instance of a specific flow version, from trigger to terminal state.
- **FlowRunStatus**: One of 12 states — 3 non-terminal (QUEUED, RUNNING, PAUSED) and 9 terminal (SUCCEEDED, FAILED, TIMEOUT, CANCELED, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED, INTERNAL_ERROR, LOG_SIZE_EXCEEDED, plus PAUSED terminal via delay).
- **LogsFile**: Zstd-compressed File entity (type FLOW_RUN_LOG) storing the full `FlowExecutorContext` after execution.
- **LogSliceRef**: Pointer (`{ fileId, size, url }`) stored in a step's `output` slot when the output exceeds the 32 KB inline threshold, with `outputType === SLICE`; the real data lives in a separate `FLOW_RUN_LOG_SLICE` File. The server-side `resolveStepOutput` helper (in `flow-run-service.ts`) downloads and deserializes that file before the trigger payload is forwarded to the worker on retry — otherwise the raw pointer would leak through as the trigger output. If the backing file is missing (the run is past the retry-retention guard, so this is an orphaned/inconsistent ref rather than expiry), it throws `ENTITY_NOT_FOUND` so the retry fails loudly instead of starting a run with no trigger payload.
- **Waitpoint**: Row in the `waitpoint` table representing one paused step on a run. Fields: `type` (DELAY|WEBHOOK), `version` (V0|V1 — V1 is the current API), `status` (PENDING|COMPLETED), `stepName`, `resumeDateTime`, `responseToSend`, `resumePayload`, `workerHandlerId`, `httpRequestId`. Unique on `(flow_run_id, step_name)`.
- **PauseMetadata** *(legacy/V0)*: JSONB column on `flow_run` distinguishing DELAY vs WEBHOOK pauses. Deprecated 2026-04-13 (0.82.0); still read for in-flight V0 runs, scheduled for removal. V1 runs store this information on the `waitpoint` row instead.
- **Retry Strategy**: FROM_FAILED_STEP (resume from exact failure point, keeping prior outputs — but if the trigger itself failed, restart with BEGIN + `executeTrigger: true` since there is nothing to resume from) or ON_LATEST_VERSION (fresh run on current published version, re-runs the trigger when the previous attempt's trigger failed).
- **ResumeReason**: `WAITPOINT` | `RETRY`. Set on every `ExecutionType.RESUME` engine operation and threaded through `ExecuteFlowJobData`. Determines whether the engine restores FAILED steps from the journal — waitpoint resumes preserve them, retry resumes drop them so the failed step re-executes. The two resume paths share the same `ExecutionType`, so this field is the only discriminator.
- **Subflow**: A child run linked via `parentRunId`, created when a flow calls another flow as a step. Terminal/non-terminal child counts for a parent are rolled up via `flowRunService.countRunsRollupByParent` (built on `countByStatus`'s optional `parentRunId` filter + the pure `rollupByStatus`, which buckets by `isFlowRunStateTerminal({ ignoreInternalError: false })`), returning `{ succeeded, failed, nonTerminal }` — consumed by the Subflows "Stream CSV" fan-in wait mode.
- **failedStep**: JSONB snapshot of `{ name, displayName, message? }` for the step that caused failure. Enables filtered retries, the runs-table error-message search, the failure email's "Reason" line, and the builder's jump-to-failed-step affordance. `message` is truncated via `truncateString` from `@activepieces/shared` before being persisted, and the engine populates `failedStep` for every status in `FAILED_STATES` (FAILED, TIMEOUT, INTERNAL_ERROR, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED) — not just `FAILED`.
- **RunTimeline**: Per-run latency breakdown (`{ legs: TimelinePhase[][] }`) persisted as a nullable `jsonb` column on `flow_run` and rendered as a stacked bar in the run-detail view. Each leg is one execution attempt's four `TimelinePhase`s — **QUEUE** (waiting to be picked up), **PROVISION** (flow bundle + pieces + engine + code install), **BOOT** (engine fork/boot/handshake, the sandbox `sandboxStart`), **RUN** (flow execution, `sandboxRun`). `legs.length > 1` means the run paused and resumed. The worker measures provision/boot as `Date.now()` deltas in `createSandboxRuntime.execute` and ships them after a successful execute by **reusing `uploadRunLog`** with a status-less, timings-only payload (`provisionMs`/`bootMs`/`runMs` are optional fields on `UploadRunLogsRequest`; a nil status skips the terminal/log-file/side-effect branches and only merges the timings into the runs-metadata queue). The app assembles the leg in `flow-runs-queue.ts#buildTimeline`: RUN = `finishTime − startTime` (matches the displayed "Took", falling back to the worker's `runMs` before finishTime lands), QUEUE = remainder `max(0, (startTime − created) − provisionMs − bootMs)`. **v1 captures leg 0 only** (`buildTimeline` never overwrites an existing timeline), so resumes don't append yet — the array shape reserves that. Null on old/warm runs where the breakdown is absent. Docs: <https://www.activepieces.com/docs/install/architecture/latency>.
- **FriendlyPieceError**: Structured error shape (`__apErrorVersion`, `message`, optional `status`, `errorName`, `requestBody`, `responseBody`, `apiMessage`, `raw`) produced by `formatPieceError` in the engine when a piece step throws (replacing the old `util.inspect` dump). The builder parses it with `tryParseFriendlyPieceError` and renders a `FriendlyErrorView` card — plain-language headline, the service's message, a "Copy Error for AI" button, and a "Technical Details" disclosure holding the `raw` dump — in both the test panel and the run-details output view.

## Entity

**FlowRun**: id, projectId, flowId, flowVersionId, environment (PRODUCTION/TESTING), logsFileId (nullable FK to File), parentRunId (nullable, self-reference for subflows), failParentOnFailure (default true), status, tags[] (nullable), startTime, triggeredBy (nullable FK to User), finishTime, timeline (JSONB, nullable — see RunTimeline), pauseMetadata (JSONB), failedStep (JSONB: `{ name, displayName, message? }`), archivedAt (soft delete), stepNameToTest (nullable), stepsCount.

## FlowRunStatus (12 States)

**Non-terminal**: QUEUED, RUNNING, PAUSED
**Terminal**: SUCCEEDED, FAILED, TIMEOUT, CANCELED, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED, INTERNAL_ERROR, LOG_SIZE_EXCEEDED

## Endpoints

- `GET /` — List runs (cursor pagination, filters: projectId, flowId, status, tags, createdAfter/Before, failedStepName, failedStepMessage). Paginates by a composite `(created DESC, id DESC)` cursor — `id` is the unique tiebreaker that keeps page boundaries stable when runs share a `created` timestamp (e.g. same-transaction inserts). `failedStepMessage` is a case-insensitive `ILIKE '%…%'` against `failedStep->>'message'`. The status and failedStepMessage filters are independent — combining a non-failure status with a failedStepMessage simply returns empty (no implicit narrowing).
- `GET /:id` — Get single run with populated data
- `POST /:id/retry` — Retry single run (strategy: FROM_FAILED_STEP or ON_LATEST_VERSION)
- `POST /retry` — Bulk retry with filters
- `POST /cancel` — Bulk cancel paused/queued runs
- `POST /archive` — Bulk soft delete (set archivedAt)
- `POST /v1/waitpoints` — Engine-only: create a waitpoint (PENDING) for a paused step
- `GET /v1/engine/flow-runs/count-by-parent` — Engine-only (`securityAccess.engine()`, scoped to `principal.projectId`; on `engine-controller.ts`): returns the `{ succeeded, failed, nonTerminal }` rollup of a parent run's children (`parentRunId` querystring). Backs the Subflows fan-in wait loop.
- `ALL /:id/waitpoints/:waitpointId` — **Deprecated.** Resume a paused run via waitpoint (V1, async). Still resumes on a bare `GET` (single-use); kept so approval emails delivered before the confirmation-page rollout keep working. Carries the scanner-prefetch weakness by design.
- `ALL /:id/waitpoints/:waitpointId/confirm` — Scanner-safe resume. `GET`/`HEAD` serves the Resume Confirmation Page (reads waitpoint from DB; shows Approve/Disapprove when still pending, else an "already responded" state) and does NOT consume. Only `POST` consumes. `POST` response content-negotiates by `Accept` (`text/html` → branded HTML result page; else `{ message }` JSON). New approval emails link here.
- `ALL /:id/waitpoints/:waitpointId/sync` — Resume and return the flow's response synchronously (V1).
- `ALL /:id/requests/:requestId` — V0 legacy resume route (pauseMetadata-based); resumes on `GET`.
- `ALL /:id/requests/:requestId/sync` — V0 legacy sync resume.

## Retry Strategies

- **FROM_FAILED_STEP**: Default path fetches execution state from zstd-compressed logs file, rebuilds FlowExecutorContext, re-runs from failed step. Previous step outputs preserved. Enqueued with `executionType: RESUME` and `resumeReason: RETRY` so the engine drops the FAILED step from the restored journal — without this, the failed step would be treated as already-complete and the retry would be a no-op. **Special case — failed trigger:** when `oldFlowRun.steps[trigger.name].status === FAILED`, there is nothing to RESUME from (the trigger never produced a real output). The retry instead enqueues `executionType: BEGIN` + `executeTrigger: true` and feeds the event preserved on the trigger step's `output` field back as `triggerPayload` — resolved through `resolveStepOutput`, which downloads and deserializes the `FLOW_RUN_LOG_SLICE` file when the output was offloaded (`outputType === SLICE`) — so `pieceTrigger.run()` re-executes against the (now-fixed) connection. Same `flowVersionId` as the original run.
- **ON_LATEST_VERSION**: Starts fresh from trigger on latest published version. Resolves the payload from `triggerStep.output` via `resolveStepOutput` (materializing the `FLOW_RUN_LOG_SLICE` file when `outputType === SLICE`) for both cases — `executeTrigger` is the discriminator. Normally `executeTrigger: false` (the previous trigger's `run()` result is replayed as-is). When the previous run's trigger step is FAILED, switches to `executeTrigger: true` so `pieceTrigger.run()` reprocesses the raw event (stored in the same `output` field) and produces correctly-shaped output for downstream actions.
- **Failed-trigger payload preservation**: `flow.operation.ts#buildFailedTriggerContext` writes `input.triggerPayload ?? {}` into the failed trigger step's `output` field via `.setOutput(...)` — the same slot a successful trigger uses for its `run()` result, so retry resolves `triggerStep.output` uniformly through `resolveStepOutput` — which downloads and deserializes the `FLOW_RUN_LOG_SLICE` file for oversized outputs so the materialized event reaches the worker rather than the raw `LogSliceRef`. This is the only place the raw event survives past the BullMQ job's completion — the job is removed on `removeOnComplete: true`, so without this both retry strategies would have no event to re-trigger from. The `executeTrigger` flag (set from `status === FAILED` at retry time) is what distinguishes replaying a processed result from reprocessing a raw payload; no separate payload field is needed.
- Constraint: only terminal states, within retention window (EXECUTION_DATA_RETENTION_DAYS).

## Logs Storage

- Stored as File entities with type FLOW_RUN_LOG
- Compressed with zstd before upload
- Worker uploads via JWT-signed URLs (7-day expiry)
- State backed up every 15s during execution for crash recovery
- Step **inputs** over `AP_FLOW_RUN_LOG_INPUT_TRUNCATE_THRESHOLD_KB` (default 2 KB) are stored as the literal placeholder `(truncated, original size X KB|MB)` — display-only; execution always resolves fresh values from prior step outputs, which are never truncated (large ones become FLOW_RUN_LOG_SLICE files). The placeholder format is a string contract between `packages/server/engine/src/lib/helper/logging-utils.ts` (`maybeTruncateInput`/`formatSize`, producer) and `packages/web/src/app/builder/run-details/truncated-input-utils.ts` (regex detector behind the run-details Input-tab notice) — change one, change both

## Pause & Resume

- **Waitpoints (V1, current):** pieces call `ctx.run.createWaitpoint({ type, ... })` + `ctx.run.waitForWaitpoint(id)`. Engine POSTs `/v1/waitpoints`; server inserts a PENDING row keyed on `(flow_run_id, step_name)`.
  - `DELAY` waitpoint: server upserts a `SystemJobName.RESUME_DELAY_WAITPOINT` BullMQ job scheduled at `resumeDateTime`. When it fires, `resumeService.resumeFromWaitpoint` enqueues the resume.
  - `WEBHOOK` waitpoint: resume signal arrives as an HTTP call on `/:id/waitpoints/:waitpointId[/sync]`. Optional `responseToSend` is replied immediately to the original webhook trigger.
  - **Resume Confirmation Page (scanner-prefetch guard):** the dedicated `/:id/waitpoints/:waitpointId/confirm` route serves a white-labeled HTML page on `GET`/`HEAD` (never consuming the waitpoint) whose Approve/Disapprove buttons `POST` back; only the `POST` resumes. On open it reads the waitpoint from the DB and shows an "already responded" state if the run has moved on. New approval emails link here (single button), so email security scanners (Safe Links, Mimecast, Proofpoint) can't consume links on prefetch. The deprecated `/:id/waitpoints/:waitpointId` route is left resuming on `GET` for already-sent emails. See ADR `docs/adr/0005-resume-links-require-post-confirmation.md`.
- **Pre-completion (resume-before-pause race):** `waitpoint-service.complete()` takes a pessimistic write lock on the PENDING row. If no row yet, it inserts a COMPLETED row with the `resumePayload`. When the flow then transitions to PAUSED, `flow-runs-queue.ts` sees the COMPLETED waitpoint and enqueues the resume immediately. Prevents dropped early callbacks.
- **TOCTOU recovery (callback/metadata-worker race):** A webhook callback and the `runsMetadataQueue` worker used to be able to interleave — the callback would read `RUNNING` and complete the waitpoint while the worker simultaneously wrote `PAUSED` and checked the (still-`PENDING`) waitpoint, leaving the run stuck in `PAUSED` forever. The fix serializes all callers of `resumeFromWaitpoint` against the metadata worker using the same distributed lock (`runs_metadata_${runId}`, RedLock) the worker already holds. Because the lock is not reentrant, callers already inside the lock (the metadata worker's pre-completed `PAUSED` path and `markParentRunAsFailed`) use `resumeFromWaitpointWithoutLock` instead. Under the lock, `handleResumeSignal` is called with the authoritative run status — the PAUSED branch deletes the waitpoint, the RUNNING/QUEUED branch completes it. After completion, a guard re-reads under the lock: if the run transitioned to PAUSED while we completed the waitpoint, the stale COMPLETED row is consumed (deleted) and the resume is enqueued, preventing it from poisoning a subsequent `createForPause` on a loop iteration. Resume jobs are enqueued under job ID `${runId}-resume-${waitpointId}` to prevent BullMQ deduplication against the still-active BEGIN job.
- **On resume:** fetch state from logs file → rebuild `FlowExecutorContext` → re-run the paused step with `ExecutionType.RESUME` and `ctx.resumePayload = waitpoint.resumePayload`. When rebuilding `flowContext` in `flow.operation.ts#getFlowExecutionState`, steps in `SUCCEEDED` / `PAUSED` are always restored; `FAILED` steps are restored iff `resumeReason === WAITPOINT`. Dropping a FAILED step kept alive by `continueOnFailure` would re-execute it from BEGIN — re-firing its waitpoint (e.g. re-invoking a subflow) and letting the global `constants.resumePayload` pollute the new output. The retry path needs the opposite behavior, hence the discriminator.
- **Limits:** `AP_PAUSED_FLOW_TIMEOUT_DAYS` caps DELAY `resumeDateTime`; engine throws `PausedFlowTimeoutError` beyond that.
- **Legacy (V0) path:** `pauseMetadata` on `flow_run` + `ctx.run.pause({ pauseMetadata })` + `ctx.generateResumeUrl()` + `/requests/:requestId[/sync]` routes. Still functional for in-flight runs; scheduled for removal.
- **On server restart:** `refill-paused-jobs` migration re-queues legacy paused runs. Waitpoint DELAYs are BullMQ delayed jobs and survive restarts natively.

## Side Effects

- `onStart()` → emit FLOW_RUN_STARTED application event
- `onResume()` → emit FLOW_RUN_RESUMED
- `onFinish()` → emit FLOW_RUN_FINISHED (terminal states only), notify via WebSocket, and (paid editions only) fire AI usage billing tracking (see AI Usage Billing below)
- Each emitter takes `{ flowRun, platformId }` and passes `platformId` straight to `applicationEvents.sendWorkerEvent` — the caller already holds it, so the synchronous webhook dispatch path (`handleSync → start → onStart`) stays free of any `getPlatformId` DB lookup. The async runs-metadata worker that fires `onFinish` resolves `platformId` itself, off the hot path.
- On run start, project telemetry (`telemetry().trackProject(...)`) is fire-and-forget via `rejectedPromiseHandler` (`helper/promise-handler`); failures are logged and never block the run

### AI Usage Billing

On every terminal run, `flow-run-hooks.ts#onFinish` calls `aiUsageTracker(log).track({ flowRun, flowVersion })` wrapped in `tryCatch`, so any failure only logs a warning and can never break run completion. The tracker short-circuits in cost order:
1. `paidEditions` (CLOUD/ENTERPRISE) and a non-nil `flowVersion` — gated in `onFinish` before the call.
2. Flow-version pre-scan: skips entirely (no log read) unless the flow contains an `@activepieces/piece-ai` step.
3. Resolves the platform's `licenseKey` (via project → platform plan); bails if empty.
4. Reads the run's step outputs via `flowRunService.getStepsOrNull({ flowRun })` (deserializes the logs file; returns null when `logsFileId` is absent).
5. `aiUsageExtractor.extractAiUsage(...)` walks the steps — recursing into loop iterations, fetching `FLOW_RUN_LOG_SLICE` files for sliced agent outputs, falling back to flow-version settings when the logged model is `**REDACTED**`, and (in single-step test mode) scoping to `flowRun.stepNameToTest` so testing one AI step doesn't bill the others. Each `@activepieces/piece-ai` step counts as one message; `run_agent` additionally counts its tool-call blocks.
6. If any usage exists, emits `BillingEvents.AI_USAGE_PER_RUN` to PostHog (distinctId = license key) with per-`(provider, model)` breakdown, `messages`, `toolCalls`, edition, ids, status, and `environment`.

A separate scheduled EE job (`ee/flow-run-tracking/`, `SystemJobName.FLOW_RUN_TRACKING`) emits `BillingEvents.TOTAL_RUNS_PER_DAY` per licensed platform once a day.

## Frontend Integration

`flowRunsApi.subscribeToTestFlowOrManualRun()` uses Socket.IO to start a test run and stream progress updates via `WebsocketClientEvent.UPDATE_RUN_PROGRESS`. The builder's run-list sidebar polls for recent runs (infinite query, auto-refetching every 15s while runs are still executing) and deduplicates entries by `id` when flattening pages — a safeguard against page overlap during live refetch. The run-details panel renders step-by-step input/output from the populated run's execution logs; step status, selection, and loop-iteration navigation all live on the canvas (`ApStepNodeStatusInRun`, step click, and `LoopIterationInput`), so there is no separate run-overview sidebar. `LoopIterationInput` (`run-details/loop-iteration-input.tsx`) renders on each loop node and, alongside its ↑/↓ iteration stepper, shows a clickable grid of per-iteration status dots (succeeded/failed/running/paused) that call `setLoopIndex` to jump straight to a failed iteration — runs also auto-pin loops to the first failed iteration via `pinLoopsToIterationsWithFailedStep`. The inspector's Input tab uses the same `SmartOutputViewer` (Friendly View / Raw JSON) as Output, and a `ClosePanelButton` sits beside the layout toggle in both run and edit panels. `flowRunMutations.useRetryRun` handles the `FLOW_RUN_RETRY_OUTSIDE_RETENTION` error code with a user-facing toast showing the retention window.

### Runs Table Filters

The runs table surfaces a Status multi-select and an "Error message" text input (`failedStepMessage` URL param). Filters are independent AND'd dimensions — the backend applies them with no implicit narrowing. Combining a non-failure status with `failedStepMessage` returns empty (only `FAILED_STATES` runs carry `failedStep.message`); the conflict is left for the user to resolve via the visible chips.

### Failed-Step Surfaces

- **Runs table failed-step column** renders the failed step's display name with a tooltip showing the truncated, JSON-pretty error message; clicking opens `FailedStepDialog` (full error + "Go to run" footer). Legacy runs without a captured message bypass the dialog and navigate straight to the run page.
- **Run-details step panel** (`flow-step-input-output.tsx`) resolves `INTERNAL_ERROR` runs by output presence, not run status alone (`INTERNAL_ERROR` is non-terminal under `isFlowRunStateTerminal({ ignoreInternalError: true })`, so it is excluded from the skeleton-loader guard to avoid an infinite skeleton). Platform admins see `InternalErrorPanel` (from `run.internalError`, stripped server-side for non-admins) only when the selected step has no output; a step that ran before the crash still shows its captured output. When there is no output, a "no logs captured, contact support" message is shown to everyone.
- **Builder run-info widget** shows up to two controls during a run:
  - A "Follow run updates" button — visible only while the run is non-terminal and the user has manually selected a different step. Clicking it calls `resumeLiveFollow`, which clears the `userManuallySelectedStepDuringRun` flag and snaps loop indexes to their latest iteration so the canvas resumes following the engine live.
  - On failure, a "See error" button that focuses the failed step on the canvas via `goToFailedStep` in `run-state`.
  - Live-follow itself is gated by `userManuallySelectedStepDuringRun` in `canvas-state`: `selectStepByName` sets it whenever the user picks a different step mid-run (`fromAutoFocus` is passed when the change came from the auto-follow effect, not a user click), and `setRun` resets it when a new run id arrives.
