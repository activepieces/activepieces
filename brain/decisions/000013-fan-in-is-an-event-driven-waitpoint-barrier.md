---
status: accepted
---

# Fan-in is an event-driven waitpoint barrier, not a poll

## Decision
A parent flow that fans out to N subflows and waits for all of them pauses on a single **fan-in barrier waitpoint** (`is_fan_in = true`) carrying `expected_children` and `terminal_children` counters. The runs-metadata worker increments `terminal_children` as each child reaches a terminal state, and resumes the parent exactly once when `terminal_children >= expected_children` (or a timeout fires). No polling, no per-child correlation column.

## Context
The parent already carries `parentRunId` on each child, and a run has **at most one PENDING waitpoint at any instant** (sequential executor + short-circuiting PAUSED). The runs-metadata worker already fires on every child terminal transition and already resumes the parent for the fail-parent case (`markParentRunAsFailed`). So a finishing child can find its barrier via `parentRunId` + the parent's single PENDING waitpoint — no new header, no `flow_run` column, no job-schema bump. This replaces the earlier temporary fan-in that self-resumed on a 30s DELAY and polled a count endpoint every wake (up to ~120 pause→resume→replay cycles for a 60-min wait).

## Why
- **Exactly-once counting** rests on three layers: (1) the child's persisted `flow_run.status` is the idempotency ledger — the `+1` only fires on a non-terminal→terminal transition, so a re-delivered BullMQ event reads an already-terminal row and skips; (2) the increment commits in the **same transaction** as the child's status write, so a crash can neither lose nor double it; (3) resume is a **stateless re-check** of the counter (`terminal >= expected`), recovered on retry, and `complete()`'s pessimistic-lock + PENDING check guarantees a single resume even under simultaneous multi-server terminals.
- **`expected_children` doubles as the "sealed" flag** (null until seal), so early children increment but cannot trigger resume before the count is known. Seal evaluates once so an all-children-finished-before-seal race (and `expected = 0`) resumes immediately instead of waiting for timeout.
- Rejected keeping the poll (DB + queue load, ≤30s latency, count conflation) and rejected a per-child attribution column (not needed while the one-PENDING-waitpoint invariant holds).

## Consequences
- **Mixed fire-and-forget fan-out → wait-for-all fan-in in one run is unsupported.** Fire-and-forget children share `parentRunId` and would miscount against the barrier, so the barrier's create-time guard throws loudly (one `count` query) if the run already has non-terminal children. Every other pattern works: a lone fan-in, back-to-back fan-ins, fan-in inside a sequential loop, fire-and-forget → a single `callFlow` wait. Workaround: put the fire-and-forget in a child flow.
- **Concurrent same-step barriers are not supported** — blocked anyway by the engine's single-pause model.
- **Upgrade path (single lever)** to remove both limitations: re-add per-child attribution — `flow_run.parentWaitpointId` (nullable, indexed) + an `ap-parent-waitpoint-id` header threaded beside `ap-parent-run-id` — then change the increment's `WHERE` from `flowRunId = :parentRunId` to `parentWaitpointId = :barrierId` and drop the create-guard. Nothing else in the design changes.
- Child failure is collected (never fails the parent; counted into `failed`) because barrier children are dispatched with `ap-fail-parent-on-failure = false`. Timeout continues with `timedOut: true` and `stillRunning > 0`, leaving stragglers running.
