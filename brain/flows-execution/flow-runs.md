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
- **A worker OOM-kill leaves the run stuck in RUNNING forever, and Cancel is greyed out.** The flow timeout is enforced *inside* the worker, so if the pod dies (OOM) nothing ever transitions the run to a terminal state; Cancel only applies to paused/queued runs, so the UI offers no way out and the run can't be retried either. Bug: activepieces#14372, fix PR #14374. Manual unblock on the customer's Postgres: `UPDATE flow_run SET status = 'CANCELED', "finishTime" = NOW(), updated = NOW() WHERE id = '<run id>' AND status = 'RUNNING';` (run id = last path segment of the run URL), then "Retry on latest version" replays the original payload.
- **Resume Confirmation Page (scanner guard)**: the `/confirm` route serves an HTML Approve/Disapprove page on `GET`/`HEAD` (never consumes) and only resumes on `POST` — stops email security scanners (Safe Links, Mimecast, Proofpoint) prefetching approval links. The deprecated bare `GET /:id/waitpoints/:waitpointId` still resumes for old emails. Slack is unchanged (server-side POST from webhook).
- **Cross-project isolation (subflow parent-fail)**: `markParentRunAsFailed` scopes its parent lookup to `{ id: parentRunId, projectId }` using the child run's authenticated `projectId`. `parentRunId`/`failParentOnFailure` arrive from spoofable webhook headers (`ap-parent-run-id`/`ap-fail-parent-on-failure`) on the public webhook endpoint, so without the scope a failed child in project A could complete a paused parent's waitpoint and resume it in project B. A cross-project parent id now matches nothing and the fail is a no-op; legitimate subflows are always same-project (Call Flow only targets flows in the caller's project).
- **ResumeReason** (`WAITPOINT`|`RETRY`) discriminates whether FAILED steps are restored on resume: waitpoint resumes preserve them, retry resumes drop them so the failed step re-executes.
- **`executionJournal.upsertStep` must stay immutable, and step retry is why.** `runWithExponentialBackoff` re-uses the *same* `executionState` for every attempt, so a failed attempt writing its `FAILED` output must not reach back into that state. While the journal still mutated the shared `steps` map (fixed in #14453), the write cleared the step's `PAUSED` status, the next attempt read `isPaused === false` and ran `BEGIN` instead of `RESUME`, armed a **new** waitpoint and paused again — a fresh engine run per resume means `attemptCount` restarts at 1, so `maxAttempts` is unreachable. For Call Flow with wait-for-response that re-invoked the subflow every 4-5s forever with the parent stuck `PAUSED` (GIT-1712, ≤0.86.3, same defect at the old `packages/shared/...` path in 0.85.5). Pinned by the retry-on-failure subflow case in `execute-flow-e2e.test.ts`.
- **Retrying a step that failed on a waitpoint resume is intentional, not an oversight.** Attempts 2-4 re-run the RESUME branch against the same stored resume payload, which is pointless for a piece that just rethrows (Call Flow burns ~28s of backoff before failing) but is exactly right for one that does real work on resume — AssemblyAI's `transcribe` fetches the transcript in its RESUME branch, so a transient API failure there is worth retrying. Suppressing retry for resumed steps would trade that away.
- **Failed-trigger payload** survives past BullMQ job completion only because `buildFailedTriggerContext` writes it into the trigger step's `output` slot.
- **The trigger step's status IS the raw-vs-extracted discriminator for retry** — there is no separate field (a `payload` field was tried and removed as redundant). `FAILED` means "`output` holds a raw event, re-run `run()` on it" (`executeTrigger: true`); `SUCCEEDED` means "`output` is already the trigger's result, replay as-is" (`executeTrigger: false`). So any code that *fabricates* a trigger step without the engine having run — the `QUOTA_EXCEEDED` admission gate is the first — must pick the status from where its payload came: raw for sync webhooks, extracted for anything sourced from the worker RPC `submitPayloads` (which passes post-`TriggerHookType.RUN` output). Get it wrong on a polling trigger and retry re-polls against an already-advanced `lastPoll` cursor, so the run gets `undefined` or an unrelated newer item *and* silently consumes those fresh items' own runs.
- **Big step outputs**: over 32 KB inline → stored as a `LogSliceRef` pointer to a `FLOW_RUN_LOG_SLICE` file (`outputType === SLICE`); missing backing file throws `ENTITY_NOT_FOUND` (loud retry failure). Step *inputs* over 2 KB (`AP_FLOW_RUN_LOG_INPUT_TRUNCATE_THRESHOLD_KB`) become a display-only truncation placeholder.
- Retries only allowed on terminal states within `EXECUTION_DATA_RETENTION_DAYS`.
- **Credit metering (Autumn)**: on terminal runs (paid editions), `onFinish` does two tryCatch-wrapped billing steps that never break run completion. (1) A PRODUCTION run not in `QUOTA_EXCEEDED` charges +1 apCredit via `billingProvider.trackCredits` with idempotency key `{runId}:run`. (2) `flowRunAiUsageTracker` pre-scans the flow version for `@activepieces/piece-ai` steps, extracts per-provider/model usage from step outputs (`flow-run-ai-usage-extractor` — recurses into loops, fetches `FLOW_RUN_LOG_SLICE` files, falls back to flow-version settings on `**REDACTED**` models), meters `Σ(messages × model credit weight) + toolCalls` to Autumn (`{runId}:ai`, plus `{runId}:appSumoAi` for the managed-ACTIVEPIECES AppSumo cap), then emits the `AI_USAGE_PER_RUN` PostHog event — the license key is only the PostHog distinctId, no longer a gate on metering.
- **Credit gate is fail-open at admission**: the worker RPC `submitPayloads` checks `shouldBlockOnCredits` (blocks only when the platform is `billingEnforced` AND the cached balance is exhausted; CE default and Autumn-outage behavior is false). A blocked run is still admitted — as a `QUOTA_EXCEEDED` run with the trigger payload persisted in its log — so it stays retryable once credits return instead of being dropped. **`AP_EDITION=ee` skips the gate entirely** (`shouldBlockRunOnCredits` returns `false` before any provider call) so self-hosters pay no Redis/Autumn latency on admission — a temporary measure, see decision 000020.
- **Post-run metering window**: AI usage is metered only at `onFinish`, so a long run can spend past the credit limit before anything lands; interim by design — see decision 000016.

### Editions
CE has full run tracking. Cloud may enforce retention windows; bulk-retry admin endpoint is Cloud-only.

### Key files
Entry point: `flowRunService`, defined in `flow-run-service.ts` and wired through `flow-run-module.ts`.

- `packages/server/api/src/app/flows/flow-run/` — controller, service, entity, hooks, side effects, runs queue, AI usage extractor/tracker
- `packages/server/api/src/app/flows/flow-run/waitpoint/` — resume routes, the `/confirm` page, and its theme hooks
- `packages/core/execution/src/lib/flow-run/` — `FlowRun` type, request dtos, execution types (`StepOutput`, `FlowExecution`), zstd log serializer
- `packages/server/engine/src/lib/helper/logging-utils.ts` — produces the truncated-input placeholder the web run-details tab detects
- `packages/server/api/src/app/ee/billing-usage-report/` — daily EE job emitting per-platform run counts to PostHog (`TOTAL_RUNS_PER_DAY`, captured and flushed in platform batches)
- `packages/web/src/features/flow-runs/` — `flowRunsApi`, run query/mutation hooks, runs table and its dialogs
- `packages/web/src/app/routes/runs/` — runs list and run detail pages
- `packages/web/src/app/builder/run-details/` — step input/output inspector inside the builder
- `packages/web/src/app/builder/run-list/` — recent runs sidebar in the builder
- `packages/web/src/app/builder/state/` — run state and canvas state, including live-follow control

Paths verified 2026-07-26. An earlier version pointed at `packages/core/shared/src/lib/automation/flow-run/` (moved to `packages/core/execution/src/lib/flow-run/`) and `packages/server/api/src/app/ee/flow-run-tracking/` (renamed to `packages/server/api/src/app/ee/billing-usage-report/`).
