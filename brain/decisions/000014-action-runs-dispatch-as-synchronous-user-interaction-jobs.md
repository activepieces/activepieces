---
status: proposed
---

# Action runs dispatch as synchronous user-interaction jobs, not queued flow jobs

## Decision
An action run is submitted through `userInteractionWatcher.submitAndWaitForResponse` as
`WorkerJobType.EXECUTE_ACTION` — the same request/response mechanism as property resolution and auth
validation — and the caller blocks on the engine's answer. It is **not** a BullMQ `EXECUTE_FLOW` job
polled for completion. Consequence: **no retry**. A worker killed mid-run fails the run instead of
re-running it. This decides the dispatch mechanism only — durable storage for action runs is not settled yet.

## Context
The path being replaced created a throwaway flow, grafted one step onto it, called
`flowRunService.test()`, polled `flow_run` every 2s for up to 120s, dug the step out of `run.steps`,
then best-effort deleted the flow. That wrote three rows per call (flow, flow_version, flow_run),
and leaked `__actionRun__` flows whenever the `finally` delete failed. Because `flow_run.flowId` is
`onDelete: CASCADE`, the successful cleanup also cascade-deleted the run row — so the old path
recorded nothing durable either, despite paying for three inserts.

Two dispatch options existed: keep it a queued flow job (retries, stalled-job recovery, but needs a
run row to poll and a flow to anchor it to), or make it a synchronous user-interaction job (no row,
no flow, no polling — but no retry).

## Why
A single ad-hoc action is a **request/response**, not a background job. The caller — an MCP client or
a chat turn — is blocked on the answer and has nowhere to put a "check back later" handle; the old
path's own 120s poll cap proves it was already synchronous in every way that mattered, just
implemented as polling.

Losing retry is a *feature* here, not a cost. Ad-hoc actions are overwhelmingly side-effecting
single calls ("send one Slack message", "create the invoice"). Silently re-firing one after a deploy
restarts the worker is worse than failing it and letting the agent decide — retry semantics that are
correct for an idempotent flow step are wrong for a bare user-initiated write.

Priority is `high`, not `critical`, so these never outrank the builder interactions a human is
actively waiting on. Note this governs dequeue *order* only: all job types share one worker pool
(`AP_WORKER_CONCURRENCY` poll loops), so a long action run still occupies a slot. That is unchanged
from the old path, which held a slot for the same 120s.

## Consequences
The watcher's shared 5-minute `WATCHER_SAFETY_TIMEOUT_MS` is too coarse for a blocking tool call, so
`submitAndWaitForResponse` takes an optional timeout and action runs pass 130s — just above the
worker's 120s sandbox cap, so the sandbox normally answers first and the watcher is only the backstop
for a worker that never replies at all. A watcher timeout maps to `TIMEOUT`, never `INTERNAL_ERROR`:
telling an agent "the engine crashed while loading or executing the piece" when nothing ran sends it
off debugging the piece instead of retrying.

`EXECUTE_ACTION` joins `UserInteractionJobData`, so it is bound by
`LATEST_JOB_DATA_SCHEMA_VERSION` — changing its payload shape needs a job-data migration, which is
what makes this decision expensive to reverse.

Because the engine runs the step with no flow around it, `EngineConstants.actionRunMode` disables
the two flow-only behaviours: the progress reporter becomes a no-op (no run to stream to), and
waitpoints are rejected via `assertActionRunCannotSuspend` as a plain `Error` so the step ends
FAILED rather than INTERNAL_ERROR — "this action only works inside a flow" is a usage error, not an
engine bug, and must not page oncall.

General rule this sets: **a user-blocking single-step execution is a user-interaction job; anything
that can outlive its caller is a queued job.** A future "run this action on a schedule" would be the
latter and would need its own run row to poll.
