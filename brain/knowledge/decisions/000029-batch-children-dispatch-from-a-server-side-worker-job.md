---
status: accepted
---

# Batch children dispatch from a server-side worker job, not from the engine

## Decision
The dispatcher and its contract ship ahead of the step that calls them; `PROCESS_IN_BATCHES` below is that
contract's consumer, and it arrives with the batch-step layer.

`PROCESS_IN_BATCHES` makes **one** call — `POST /v1/waitpoints` with the barrier and its source handed over
— and pauses. The source is stored out of band in `distributedStore` under a barrier-keyed key; the job
carries only that key. A dedicated **fan-out dispatcher job** on the barrier queue then creates the children.

Each child is preceded by a **compare-and-set claim** on its own signal row:

```sql
UPDATE waitpoint_signal SET "refId" = $childRunId
 WHERE id = $signalId AND "refId" IS NULL RETURNING id
```

No row returned → another dispatcher owns that batch → skip it. `flowRunService.dispatchChild` stays an
in-process service method; its HTTP wrapper (`POST /v1/flow-runs/dispatch`) is deleted, and it now
**rejects** an unresolvable barrier instead of warning and dispatching unattributed. The dispatcher treats
that rejection as *stop, do not retry*. Its failure handler marks the undispatched signals `NOT_DISPATCHED`,
so the barrier releases in minutes with a truthful summary rather than waiting out its deadline.

This supersedes the previous decision on this page, which dispatched through a dedicated engine-facing
endpoint driven by a loop in the parent's sandbox.

## Context
The loop used to run in the engine, inside the parent's sandbox, which is killed at `FLOW_TIMEOUT_SECONDS`.
Everything that made that survivable — a source digest, a resumable complement computed from
`dispatchedIndices`, a unique `(parentWaitpointId, dispatchIndex)` index, a piece-framework version floor for
the `sealFanIn` hook — existed to answer "what did the previous, killed attempt already send?".

A worker job is **redelivered rather than killed**, and it re-reads *stored bytes* instead of re-resolving
items from a re-executed flow prefix.

## Why
- **Nothing re-resolves the items, so nothing can disagree about them** — the digest is gone.
- **The dispatcher's resume point is a claim, not a gap query.** "Signals with no child run yet" is a
  read-then-write with nothing enforcing it, and with the unique index gone there is no index standing behind
  it. Two live dispatchers are not hypothetical: `stalledInterval` is 30s and `maxStalledCount` 3, and this
  job parses a multi-MB source on the worker's event loop — a stall past 30s redelivers it to a second worker
  while the first is still running. A stalled job is not evidence the worker died.
- **The guarantee moves from an index on the hottest table to a single-row update on a narrow one.**
- **A cancel now actually cancels.** `cancelSingleRun` deletes the run's waitpoints, so a cancelled barrier
  stops resolving and the dispatcher aborts within one child. Without the rejection, children kept being
  created after the cancel, ran user steps, billed tasks and AI credits, and were hidden from the runs list.
  The window was not a race: the parent is PAUSED and selectable for the whole ~60s dispatch window, and the
  8-minute retry backoff turns a partial fan-out into an eight-minute gap in which a cancel lands cleanly.
- **The step makes an ordinary HTTP call rather than a hook that may be missing on the running server**, so
  there is no piece-framework version floor — and no multi-day hang when one is forgotten.
- **The source is out of band for the same reason `runs_metadata:<runId>` is.** A multi-MB array inside
  BullMQ job data is a Redis payload sitting on a hot queue. The key is deleted when the barrier resolves and
  on the cancel path, alongside the signal rows.

## Consequences
- **The dispatcher holds a worker poll slot for the dispatch window — ~60s at 10 000 children.**
  `benchmark/PROCESS-IN-BATCHES-BENCHMARK.md` S5 measured 200 children in 1 293 ms (~174/s); moving the loop
  server-side removes the HTTP hop but keeps the per-child cost. On a concurrency-1 install that is a full
  minute of stall before any child starts. Mitigated with bounded in-flight dispatches, not removed.
- **Nothing bounds the dispatch window except the barrier deadline.** The old loop ran in the parent's
  sandbox, where `FLOW_TIMEOUT_SECONDS` failed a dead dispatcher loudly inside 10 minutes. Now the parent
  pauses *before* its children exist.
- **`AP_MAX_BARRIER_SIGNALS` is 10 000 and batch size is derived or clamped to fit it**, then reported in the
  step output. A 1M-row CSV at 100 rows/batch is exactly 10 000 signals; the batch size is not a free-text
  field that can silently blow the cap.
- **The engine-facing surface shrinks to one call.** `POST /v1/flow-runs/dispatch`, `POST /v1/waitpoints/:id/seal`,
  the engine's `child-run-client.ts` and the framework's `sealFanIn` hook are all deleted.
- **CSV becomes the same job with a streaming parser** — the one source that does not fit Fastify's
  `bodyLimit` and needs a file instead.
