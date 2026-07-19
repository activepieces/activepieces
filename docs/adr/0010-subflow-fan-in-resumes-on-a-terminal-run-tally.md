---
status: accepted
amends: 0009
---

# Subflow Fan-in resumes on a terminal-run tally, not a callback

Amends [ADR-0009](./0009-streaming-csv-fanout-is-a-bounded-fire-and-forget-action.md).

`Stream CSV to Subflows` gains an **opt-in** `waitForSubflows` mode (**Subflow Fan-in**): after
dispatching all batches, the parent pauses on a **Join Waitpoint** and resumes once every
dispatched child run reaches a terminal state, returning a `{ completed, failed }` summary.

The signal is a child's terminal `flow_run` row itself — indexed by `parentRunId`. There is
**no** completion token, callback URL, `Respond` contract, new `PauseType`, or polling. A Join
Waitpoint is an ordinary `WEBHOOK` waitpoint carrying a non-null `expectedCount`; that field is
the sole discriminator. When a child lands in a terminal status, the `runsMetadataQueue` worker
(which already persists child rows under `distributedLock(runs_metadata_${runId})`) loads the
parent's pending waitpoint and, if `expectedCount != null`, runs `COUNT(flow_run WHERE
parentRunId = :p AND status terminal)`; on `>= expectedCount` it completes+resumes the parent.

COUNT is the **whole mechanism** and it is idempotent — BullMQ job retries, resume-before-pause
races, and concurrent final completions all wash out because it reads committed DB state rather
than mutating a counter. Exactly-once resume comes from `waitpointService.complete()`, which is
pessimistic-locked with a `WHERE status = PENDING` guard: of N children that observe the tally at
the threshold, exactly one flips the waitpoint `PENDING → COMPLETED` and resumes; the rest see it
already completed and no-op. No Redis, no counter column, no fast-path.

The **finish-before-pause race** (all children terminate before the parent's PAUSED row exists)
is closed by the parent's own PAUSED upload: that path already runs in the worker, holds the
parent's lock, and re-runs the same COUNT-and-complete. So both edges — last child completing
after the pause, and the pause landing after the last child — route through one shared
`completeFanInIfDone` helper (the only difference is which lock is already held).

## Why this doesn't contradict ADR-0009

ADR-0009 rejected "wait-for-response fan-in" as *"incompatible with a many-batch fan-out inside
one 600s step."* That objection was about doing the **wait inline**. It no longer holds because
the wait happens via a waitpoint **pause**, which releases the sandbox: the *dispatch* stays
bounded by `FLOW_TIMEOUT_SECONDS` (ADR-0009 unchanged), but the *wait* is bounded by
`PAUSED_FLOW_TIMEOUT_DAYS`. ADR-0009's other decisions stand: the action is still fire-and-forget
**by default** (the mode is opt-in), still streams from a URL, still bounds memory not time.

## Considered options

- **Persist a counter and increment per completion.** Rejected: an increment is a second commit,
  separate from the child's terminal-status commit; a crash between them (or a BullMQ retry that
  skips the already-terminal child) leaves the tally permanently short and hangs the parent. A
  COUNT over the existing `parentRunId` index reads committed state, so it never drifts and is
  naturally exactly-once at the threshold.
- **Redis SADD/SCARD fast-path in front of COUNT** (to avoid COUNTing on every completion).
  Rejected as premature optimization: at ADR-0009's bounded fan-out, COUNT over
  `idx_run_parent_run_id` is cheap, and Redis being non-authoritative dragged in a durable
  `countDegraded` fallback column and mid-flight key-loss detection to stay correct — a lot of
  moving parts to cache one indexed COUNT. Add it back only if a large fan-out measurably regresses.
- **New `PauseType` / entity / token protocol.** Rejected as over-engineering — a nullable
  `expectedCount` column on the existing waitpoint is the whole mechanism.

## Consequences

- **Result is a count summary**, `{ completed, failed }` (`completed + failed == expectedCount`),
  computed once at resume. No payload aggregation.
- **Failed batches count toward completion** — the CSV action keeps `FAIL_PARENT_ON_FAILURE=false`,
  so a failed child is terminal and counts as `failed` rather than preempting the join. (Fail-fast
  via `failParentOnFailure=true`, used by `callFlow`, still preempts and is untouched.)
- **A per-child join lookup on the subflow path.** Every terminal child with a `parentRunId` now
  does one indexed `getPendingByFlowRunId(parent)` read; only Join parents (non-null
  `expectedCount`) go on to COUNT. Regular subflow completions pay a single indexed read and stop.
- **Orphan child → indefinite pause.** If a dispatched child's run never materializes, COUNT never
  reaches N and the parent pauses until data-retention cleanup — identical to today's `callFlow` +
  `waitForResponse` when a child never responds. An orphan-timeout backstop is future work.
