---
title: Server-side fan-out
icon: 🪓
---

# Server-side fan-out

The barrier's own child dispatcher. A batch step hands the server its items in one `POST /v1/waitpoints`, and a
`fan-out-dispatch` job on the barrier queue creates one child run per signal. The step that calls it
(`PROCESS_IN_BATCHES`) ships with the batch-step layer; until then only tests drive it. See decision
[000051](../decisions/000051-batch-children-are-dispatched-by-an-app-queue-job-not-the-engine.md) for why, and
[000015](../decisions/000015-fan-in-is-an-event-driven-waitpoint-barrier.md) for the barrier.

**Server-side fan-out** — one parent pause, N child runs created by the app. _Avoid_: "subflow fan-out", which is
fire-and-forget webhook calls with no barrier.
**Source** — `{ entryStepName, batchStepName, seedSteps, batches }` stored under `barrier_source:<barrierId>` with a 1-day TTL.
Deleted on release, on cancel and when dispatch gives up.
**Claim** — a signal is claimed when its `refId` holds its child run id. _Unclaimed_ means `PENDING` with no
`refId` (`unclaimedSignalWhere`).
**Chunk** — one transaction: the barrier `FOR SHARE`, the next 25 unclaimed signals `FOR UPDATE SKIP LOCKED`, the
claim, and the child rows.
**Entry step** — `entryStepName`, the action a child run starts at, with the parent's steps seeded as SUCCEEDED.
It is written into the child's execution-state log, so a resume re-enters it. It must be an action.
**Give-up** — the barrier worker's `failed` handler, on exhausted attempts or an `UnrecoverableError`. It deletes
the source, then marks the unclaimed signals `NOT_DISPATCHED`.

## Gotchas
- **The waitpoint key is not the batch step's name.** Inside a loop the barrier's `stepName` is the path key
  `loop_1:3/batch_1`, which keeps one barrier per iteration. The body reads its batch under the bare name, so the
  engine sends that name as `batchStepName` and the dispatcher seeds the batch under it.
- **Raw `UPDATE … RETURNING` through `repo.query()` returns `[rows, rowCount]` on node-postgres but a plain rows
  array on PGlite.** A `.length > 0` check on it is always true in production and only correct in tests. Read
  `RETURNING` rows through the query builder (`.returning().execute()`, then `raw`), as `claimNextSignals` does.
- **PGlite runs every transaction on one shared session, so row locks do nothing in the API tests.** The claim
  stays correct without them: the `UPDATE` keeps its `refId IS NULL AND status = 'PENDING'` guard, and the claims
  are the rows it returned, not the rows the `SELECT … FOR UPDATE` saw.
- **A stalled job is not a dead worker.** On BullMQ defaults the first stall redelivers the job to a second
  dispatcher while the first still runs. The second stall fails it as an `UnrecoverableError` on the next pickup,
  with `attemptsMade` unchanged, so `fanOutDispatchGaveUp` checks for both.
- **A claim released after the give-up must settle itself.** When an enqueue fails, the dispatcher deletes the
  child row and clears the claim so a later attempt can retry it. If the give-up sweep already ran, no attempt is
  left, so the dispatcher then checks the source key and, if it is gone, marks the signal `NOT_DISPATCHED`. The
  give-up handler deletes the key before its sweep, so one of the two always settles the signal.
- **A chunk settles before the job fails.** `enqueueChunk` uses `Promise.allSettled`, so every release lands before
  BullMQ fires `failed`. With `Promise.all` the sweep ran while the other tasks still claimed and released.
- **Never widen a sweep to "all `PENDING`".** A dispatched signal stays `PENDING` with a `refId` until its child
  ends, and a body that waits on an approval keeps it there for days. A status-only sweep marks live children
  `NOT_DISPATCHED`, the barrier releases, and their outcomes report into nothing.
- **A child claimed just before a release never starts.** Its enqueue needs the barrier `PENDING`, so the
  dispatcher cancels it instead (`cancelUnstartedChildRun`). The release summary still counts it as `stillRunning`
  with its run id, because its claim came first.
- **The engine retries `POST /v1/waitpoints` on a 500.** The retry reuses the open barrier, so `create` stores the
  source and adds the dispatch job on that path too. The fixed job id `dispatch-<barrierId>` and the claims make
  the repeat safe.
- **Run credits are checked once per chunk.** With none left, the dispatcher marks the unclaimed signals
  `NOT_DISPATCHED`; children already claimed keep running.
- **Each child carries its own copy of `seedSteps`**, inline below `WEBHOOK_PAYLOAD_INLINE_THRESHOLD_KB` and as a
  file above it.
- **The parent's run timeline no longer measures dispatch cost.** Its first leg is one HTTP call. Measure the span
  of the children's `created` timestamps instead.
- **`barrier-queue-factory.ts` is the module graph's acyclic leaf.** `barrierSourceKey` and the job types live
  there so `waitpoint-service.ts` imports the key without the queue. Folding it into `barrier-queue.ts` adds an
  import cycle.

## Key files
- `packages/server/api/src/app/waitpoints/` — `handleFanOutDispatch`, `barrierService.claimNextSignals`
- `packages/server/api/src/app/flows/flow-run/` — `prepareChildDispatch`, `createChildRuns`, `enqueueChildRun`
- `packages/server/engine/src/lib/operations/` — `flowOperation`, which enters a run at `entryStepName`
