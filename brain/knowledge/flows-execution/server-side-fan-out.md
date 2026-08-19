---
title: Server-side fan-out
icon: 🪓
---

# Server-side fan-out

**Status: the dispatcher ships; its only caller does not yet.** The dispatch loop that creates a batch step's
children runs in a **worker job on the app**, not in the parent's engine sandbox. The loop, the claim and the
barrier plumbing below are live and covered by tests that drive them directly; the `PROCESS_IN_BATCHES` step
that calls them arrives with the batch-step layer, so read every `PROCESS_IN_BATCHES` mention below as the
contract the dispatcher already honours rather than a step you can add to a flow today. See decision
[000029](../decisions/000029-batch-children-dispatch-from-a-server-side-worker-job.md) for why, and
[000015](../decisions/000015-fan-in-is-an-event-driven-waitpoint-barrier.md) for the barrier it dispatches
against.

## The shape

1. `PROCESS_IN_BATCHES` resolves its items and makes **one** call: `POST /v1/waitpoints` with
   `type: BARRIER` and `barrier.fanOut = { entryStepName, batchSize, items, seedSteps }`.
2. In one transaction the server creates the barrier waitpoint (`sealed = true`, deadline set) and one
   `waitpoint_signal` row per batch, `sequence = 0..N-1`. **Arrays are born sealed.**
3. The source (`entryStepName`, `seedSteps`, the chunked batches) goes to `distributedStore` under
   `barrier_source:<barrierId>`; a `fan-out-dispatch` job carrying only the barrier id goes on the barrier
   queue. The step pauses.
4. The dispatcher claims each signal (`SET refId = $childRunId WHERE refId IS NULL`), then calls
   `flowRunService.dispatchChild` in process. Bounded at 5 in flight.
5. Each child's terminal transition writes its outcome onto its signal (`receive` by `refId`) and enqueues a
   coalesced evaluation. The last one releases the barrier.

## Where the jobs live

Both jobs need Postgres, so **neither can be a `WorkerJobType`** — `AP_CONTAINER_TYPE=WORKER` boots no
TypeORM connection and no Redis client. They run in the app process, on a **dedicated queue**
(`QueueName.BARRIER_JOBS`, `barrier-queue-factory.ts` + a `new Worker` in `barrier-queue.ts`), copied from
`runs-metadata-queue-factory.ts` and `flow-runs-queue.ts`.

The shared `system-job-queue` was rejected: it cannot coalesce. `upsertJob` with `jobId = barrierId` looks
like coalescing and behaves like a bug — while a job is active the next upsert finds it and no-ops, the last
signal's evaluation is dropped, and there is no `removeDeduplicationKey` escape hatch because there is no
deduplication key. BullMQ's own `deduplication` is the only mechanism in the repo with a documented way out
of that window.

## Costs, priced

`benchmark/PROCESS-IN-BATCHES-BENCHMARK.md` S5 measured 200 children in **1 293 ms (~174/s)** on a quiet
single-app/single-worker rig with warm sandboxes. Moving the loop server-side removes the HTTP hop but keeps
the per-child cost: barrier freshness read, insert, `addToQueue`, `onStart`. Budget **~60 s of held poll slot
at the 10 000 cap**, and re-derive the number rather than quoting an estimate. A priority above the children
orders the queue but does not free the slot.

Only the barrier read is per child, and only because it must be fresh. Everything else the dispatch needs is
invariant across the barrier and is resolved once by `flowRunService.prepareChildDispatch` — parent run,
flow version (the whole JSONB graph, the migration service, and the `flowStructureUtil.getStep` tree walk
that validates `entryStepName`), and `projectId → platformId`. It used to be five SELECTs and one flow-graph
parse *per child*, i.e. ~40 000 SELECTs and 10 000 parses at the cap, five-wide inside the app process while
it also served HTTP. Do not reintroduce a read inside `dispatchChild`: if a new value is needed, put it on
`ChildDispatchTarget`.

## Gotchas

- **A batch step cannot be placed inside another batch step, and the guard is post-hoc rather than
  positional.** `flowOperations.apply` runs the operation and *then* rejects if the result nests a batch **and
  the input did not** (`FLOW_OPERATION_INVALID`). Written that way on purpose: it needs no reasoning about
  `stepLocationRelativeToParent`, it catches every insertion shape — including nesting through an intermediate
  loop or router — and the "input did not" clause means an existing flow that somehow contains one is never
  invalidated, so the constraint is non-breaking by construction and a grandfathered flow stays editable.
- **The nesting guard belongs in `apply`, not in one operation.** It first shipped inside `_addAction`, which
  covered more than it looked like it did — move, paste, duplicate and import all decompose into `ADD_ACTION`s
  routed back through `apply`, so all four were caught. `UPDATE_ACTION` was not: it edits a step in place, so
  retyping a body step to `PROCESS_IN_BATCHES` persisted a nested batch that came back `valid: true` and was
  publishable. Nothing downstream catches that — `flow-version-validator-util.ts` validates settings, never
  structure. The guard now wraps every operation in `apply`, which is the shape that stays closed as operations
  are added; a per-operation copy is the same bug waiting on the next one that edits a step in place.
- **`UPDATE_ACTION` must carry `firstLoopAction` across a loop/batch conversion.** Both `LOOP_ON_ITEMS` and
  `PROCESS_IN_BATCHES` hold their body in `firstLoopAction`, but `_updateAction` reads existing state per
  *requested* type; a check written as `stepToUpdate.type === <the requested type>` silently drops the whole body
  when the user retypes a loop into a batch (or back). The check has to accept either container type. `sampleData`
  is deliberately *not* carried across — the two settings shapes differ.
- **The builder's `isInsideBatch` is affordance, not enforcement.** It hides the piece
  (`pieceSelectorUtils.isInsideBatch` → `excludeProcessInBatches`) but returns `false` for anything that is not
  `ADD_ACTION`, so replacing a step inside a batch region still offers Process in Batches and the user meets the
  operation-layer error. The operation layer is the authority, which is what makes the constraint hold for MCP
  `ap_add_step` and any API client too.
- **A child run's entry step has to survive a pause.** A child starts at the batch body's entry step with the
  parent's steps seeded as SUCCEEDED, so the engine cannot walk from the trigger — the batch step itself would
  read as already done and the walk would fall through to the step *after* the batch. `entryStepName` arrives on
  the BEGIN job and is written into the child's own execution-state log, which RESUME already downloads and
  cannot run without; nothing about it is stored on `flow_run`. When it was BEGIN-only, a body step that paused
  (approval, delay) resumed from the trigger instead: its BEGIN placeholder output stayed forever (an approval
  showed `approved: false`, the step stayed `PAUSED` on a run the UI reported as succeeded) and the post-batch
  step ran a second time, inside the child.
- **A stalled job is not evidence the worker died.** The `maxStalledCount: 3` in the repo is `job-broker.ts`'s,
  not this queue's — `barrier-queue.ts` passes only `connection`, `concurrency` and `autorun`, so the barrier
  worker runs on BullMQ's defaults: `stalledInterval` 30s and `maxStalledCount` **1**. One stall is therefore
  terminal here, and this job parses a multi-MB source on the event loop. Two dispatchers over one barrier is
  the normal case to design for, not the exotic one — which is why every child is preceded by a
  compare-and-set claim on its signal row rather than a "signals with no child yet" gap query.
- **A cancel must stop the dispatcher.** `dispatchChild` rejects (`ENTITY_NOT_FOUND`) when the barrier no
  longer resolves, and the dispatcher treats that as *stop, do not retry* — log, complete the job. Abort
  latency is up to four extra attempts, not one: the `cancelled` flag is read at task entry and
  `MAX_DISPATCHES_IN_FLIGHT` is 5, so four siblings can already be past it — each re-checks the barrier
  inside `dispatchChild`, so an extra *child* needs a race between that check and the barrier's deletion.
  `getAllChildRuns` cannot clean up after the fact: it is a one-shot recursive snapshot
  taken *after* the parents are cancelled, so anything created later is never seen by it.
- **A claim that reports `affected` is not a claim.** TypeORM's `UpdateQueryBuilder.execute()` does not
  reliably populate `affected` on every driver here; the claim uses raw SQL with `RETURNING "id"` and checks
  the returned rows. Getting this wrong makes every claim look failed and dispatches nothing, silently.
- **The dispatcher releases its claim before rethrowing, which makes "`dispatchChild` throws ⇒ no child
  exists" a load-bearing invariant.** A per-child failure nulls `refId` again so the retry can re-claim; only
  a job that has given up for good marks the *unclaimed* signals `NOT_DISPATCHED`. `dispatchChild` upholds its
  half by deleting the `flow_run` row it inserted when `addToQueue` fails. Anything that throws *after* a
  successful `addToQueue` breaks it: the child is queued and running, the claim is released, and the ~8-minute
  retry dispatches a **second** child for the same batch — while the first child's completion signal is
  silently dropped, because `receive({ refId })` no longer matches the row it nulled.
  `flowRunSideEffects.onStart` was exactly that hole and is now wrapped in `tryCatch`. There is no unique
  index on `flow_run (parentWaitpointId, dispatchIndex)` to backstop this, so keep the invariant in the code.
- **Two words, two predicates: a signal is *claimed* when `refId` is non-null, and *undispatched* only when it
  is `PENDING` **and** unclaimed.** `markUnclaimedNotDispatched` and `listUnclaimedSignals` therefore share one
  where-clause (`unclaimedSignalWhere`), and `claimSignal` guards on `AND "status" = 'PENDING'` as well as
  `refId IS NULL`. Do not widen any of them to "all `PENDING` rows". A dispatched signal stays `PENDING` with a
  non-null `refId` until its child reaches a terminal state, and `QUEUED`/`RUNNING`/`PAUSED` are all
  non-terminal — a batch body holding an approval keeps its signal `PENDING` for days. A sweep keyed on status
  alone therefore condemns live children, and because `NOT_DISPATCHED` is in `UNFAVOURABLE_SIGNAL_STATUSES` and
  leaves zero `PENDING` on a sealed barrier, evaluation releases at once, `completeAndDrainSignals` **deletes**
  the signal rows, and each child reports into nothing — orphaned, uncancelled, while
  `process-in-batches-executor` counts it under `notDispatched` and tells the user "N of M batches failed".
  Two windows made this reachable in one attempt, not just across the ~2 h ladder: `Promise.all` rejects on the
  first error while its siblings are still dispatching, and `moveToFailed` increments `attemptsMade` *before*
  `emit('failed')`, so the give-up handler fires on the 5th attempt with those siblings mid-flight.
- **"Gave up" is not "ran out of attempts" — `fanOutDispatchGaveUp` checks `UnrecoverableError` too.** A stall
  bumps `stc`, not `atm`: past `maxStalledCount` the lua script parks a `defa` reason and the next pickup fails
  the job as an `UnrecoverableError` *without running the processor*, `attemptsMade` untouched. An
  `attemptsMade >= attempts` test alone therefore misses the likeliest death — a dispatcher whose process died
  twice — and the barrier hangs to its deadline, exactly what the handler exists to avoid. This is also the
  case with the *most* claimed signals, since the first stall redelivers the job to a second dispatcher while
  the first may still be running, so both guards have to hold together.
- **A dropped outcome is now loud.** `receive` logs a `warn` when no signal row matches, because that is the
  one moment a child's result is discarded — a barrier released early, a swept row, or the double-dispatch hole
  above. If that warning appears, the "throws ⇒ no child" invariant broke; reconciling claimed signals against
  their `flow_run` rows is the fix, and `sweepOverdueDeadlines` is the periodic backstop in the meantime.
- **The source-gone branch is theory; the give-up branch is the live one.** The stored source carries a 1-day
  TTL and the whole retry ladder is ~2 h, so a dispatch can't outlive its own source. Both call the same sweep,
  so both are guarded, but don't reason about behaviour from the source-gone path.
- **Nothing bounds the dispatch window except the barrier deadline.** The old sandbox loop was bounded by
  `FLOW_TIMEOUT_SECONDS`; the parent now pauses before its children exist.
- **The source key is deleted on release and on cancel**, and carries a 1-day TTL as a backstop. A dispatcher
  that finds no source marks the remaining signals `NOT_DISPATCHED` rather than hanging.
- **The parent's run timeline no longer measures dispatch cost, and the metric got *better-looking* as it
  stopped meaning anything.** The parent's first leg is now one `POST /v1/waitpoints` call, so its `RUN`
  phase reads ~90–120 ms whether it fans out 10 children or 200 — the benchmark's `dispatchMs` fell from
  1 293 ms to 116 ms at 200 children purely because the loop moved into the dispatcher job. Measure the span
  of the children's `created` timestamps instead (~4.3 ms per child at 200 wide). Any dashboard or benchmark
  reading fan-out cost off the parent leg is silently reporting a constant.
- **There is no live progress for a running batch step, by construction.** The per-status counts
  (`succeeded`, `failed`, `stillRunning`, …) live only in the batch step's *output*, and the output is written
  when the barrier releases — so mid-run the UI has `barrierId`, `totalItems`, `batchSize`, `total` and
  nothing else (`batchUtils.headerState` returns `{ kind: 'pending' }`). Anything that wants a live progress
  bar needs a second source. The cheap one is `flowRunService.countByStatus`, which today hardcodes
  `parentWaitpointId: IsNull()` to exclude children; taking a `parentWaitpointId` instead is index-only work,
  the partial index `(parentWaitpointId, projectId, dispatchIndex, status)` already covers the group-by.
  Paginating `flowRuns.list` client-side to count is the trap — it is O(children) requests for six numbers.
- **`barrier-queue-factory.ts` is the module graph's acyclic leaf, not a testing seam.** `barrier-queue.ts`
  already sits in two import cycles (with `barrier-service.ts` and with `fan-out-dispatcher-job.ts`), so the
  factory file is where `barrierSourceKey` and the shared job types live for everyone who needs them without
  the queue — `waitpoint-service.ts` imports the key alone. Folding the factory into `barrier-queue.ts` to
  save the pass-through methods therefore adds a third cycle,
  `waitpoint-service → barrier-queue → barrier-service → resume-service → waitpoint-service`. Move the
  closure if you like; leave the key and the types on a leaf.
- **`isBarrierGone` matches *any* `ENTITY_NOT_FOUND`, so anything inside the dispatch loop that throws that
  code is misread as "the barrier was cancelled" — the job completes, no evaluation is enqueued, and the
  barrier hangs to its deadline.** `flowVersionService.getOneOrThrow` was exactly such a source until the
  flow-version read moved to `prepareChildDispatch`, above the loop, where the same error fails the job and
  the barrier releases on retry exhaustion instead. After that move the barrier freshness check is the only
  `ENTITY_NOT_FOUND` inside `dispatchChild`, which is what makes the heuristic sound. Keep it that way.
- **The dispatcher must still enqueue an evaluation when it has nothing to dispatch.** Two dispatchers over
  one barrier is the normal case, `waitpoint` has no FK to `flow_run`, so "parent run gone, barrier still
  PENDING" is reachable — a second dispatcher that finds zero unclaimed signals has to return via
  `addEvaluation`, not by failing a validation that then burns the whole retry ladder before release.
- **A bare `rejects.toThrow()` in `barrier.test.ts` will pass on the wrong guard.** `createMockFlowVersion`
  builds a flow whose only step is the trigger named `trigger` — there is no `step_1`. A test written to
  assert the barrier guard while passing `entryStepName: 'step_1'` was in fact tripping the entry-step
  validation and never reached the barrier at all. Assert the `ErrorCode` in these tests; the guards in this
  path throw deliberately different ones (`VALIDATION` for the target, `ENTITY_NOT_FOUND` for the barrier).
