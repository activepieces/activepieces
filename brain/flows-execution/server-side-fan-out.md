---
title: Server-side fan-out
icon: 🪓
---

# Server-side fan-out

**Status: shipped.** The dispatch loop that creates a batch step's children runs in a **worker job on the
app**, not in the parent's engine sandbox. See decision
[000026](../decisions/000026-batch-children-dispatch-from-a-server-side-worker-job.md) for why, and
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
  positional.** `_addAction` applies the transform and *then* rejects if the result nests a batch **and the
  input did not** (`FLOW_OPERATION_INVALID`). Written that way on purpose: it needs no reasoning about
  `stepLocationRelativeToParent`, it catches every insertion shape — including nesting through an
  intermediate loop or router, and a container pasted *with* a batch already inside it, since paste and
  duplicate both route through `ADD_ACTION` — and the "input did not" clause means an existing flow that
  somehow contains one is never invalidated, so the constraint is non-breaking by construction. The builder
  hides the piece rather than letting the user hit the error (`pieceSelectorUtils.isInsideBatch` →
  `excludeProcessInBatches`), but that is affordance only — `isInsideBatch` bails unless the operation is
  `ADD_ACTION`, so replacing a step that already sits inside a batch region still offers the piece and the user
  meets the error. The operation layer is the authority, which is what makes it hold for MCP `ap_add_step` too. The constraint is new — nothing in
  `flow-version-validator-util.ts` (settings-only), the selector, or `add-action` forbade it before. The
  trigger was visual: two nested batch regions on the canvas draw *exactly coincident* hairlines, not inset
  ones, so nesting read as one box with two stray rules across it.
- **A child run's entry step has to survive a pause.** A child starts at the batch body's entry step with the
  parent's steps seeded as SUCCEEDED, so the engine cannot walk from the trigger — the batch step itself would
  read as already done and the walk would fall through to the step *after* the batch. `entryStepName` arrives on
  the BEGIN job and is written into the child's own execution-state log, which RESUME already downloads and
  cannot run without; nothing about it is stored on `flow_run`. When it was BEGIN-only, a body step that paused
  (approval, delay) resumed from the trigger instead: its BEGIN placeholder output stayed forever (an approval
  showed `approved: false`, the step stayed `PAUSED` on a run the UI reported as succeeded) and the post-batch
  step ran a second time, inside the child.
- **A stalled job is not evidence the worker died.** `stalledInterval` is 30s, `maxStalledCount` 3, and this
  job parses a multi-MB source on the event loop. Two dispatchers over one barrier is the normal case to
  design for, not the exotic one — which is why every child is preceded by a compare-and-set claim on its
  signal row rather than a "signals with no child yet" gap query.
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
  an exhausted job marks the rest `NOT_DISPATCHED`. `dispatchChild` upholds its half by deleting the
  `flow_run` row it inserted when `addToQueue` fails. Anything that throws *after* a successful `addToQueue`
  breaks it: the child is queued and running, the claim is released, and the ~8-minute retry dispatches a
  **second** child for the same batch — while the first child's completion signal is silently dropped,
  because `receive({ refId })` no longer matches the row it nulled. `flowRunSideEffects.onStart` was exactly
  that hole and is now wrapped in `tryCatch`. There is no unique index on
  `flow_run (parentWaitpointId, dispatchIndex)` to backstop this, so keep the invariant in the code.
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
- **Design-time item counts are free, but only for whole-field mentions off the last test run.**
  `processInBatchesUtils.resolveItemsCount` (web `step-settings/process-in-batches-utils.ts`) powers the
  batch plan summary's "items" stat and is the reusable hook for any "your list is huge" nudge, on the loop
  step included. It costs nothing at any size — it walks the mention path and reads `.length`, never the
  elements, and `outputSampleData` is already in the builder store from one fetch per flow load, so no
  request and no parse. Its two blind spots are structural: it returns `null` unless `settings.items` is a
  single whole-field mention (`{{ step.body.rows }}` — any formula or concatenation is unresolvable), and
  the number it reports is the **test payload's** length, not production's, which is why the panel labels it
  "Based on your last test run". A user who tests with 10 rows and runs 50 000 sees no warning; a hard limit
  needs server-side validation, not this. The loop step's own >10 000-item warning
  (`LargeListWarning` in `step-settings/loops-settings.tsx`) rides on it, and **suppresses itself when the
  loop already sits inside a batch region** — a batch cannot nest in a batch, so the selector hides the piece
  there and the nudge would be unfollowable. `pieceSelectorUtils.isInsideBatch` cannot answer that question:
  it is keyed to a `PieceSelectorOperation` and returns false unless the operation is `ADD_ACTION`. For an
  *existing* step, walk `getAllSteps` and ask `flowStructureUtil.isChildOf(batchStep, stepName)` —
  `findPathToStep` is the wrong tool, it follows `nextAction` and so matches earlier siblings, not just ancestors.
- **The run view renders one DOM node per loop iteration, unvirtualized.**
  `run-details/loop-iteration-input.tsx` maps every iteration to a `<button>` inside a `<Tooltip>` in a
  120px scroll box, and `getIterationStatus` walks each iteration's step outputs. Fine at 20 rounds, ~20 000
  components at 10 000 — cap the dots before pointing anyone at a wide loop.
- **Replacing a loop with a batch throws its body away, and the two containers bind different names, so
  "just keep `firstLoopAction`" is the wrong fix.** `_updateAction` (core-execution
  `operations/update-action.ts`) carries `firstLoopAction` over only when the *old* step already had the
  same type, so a loop→batch replace silently drops every step in the body. Preserving it flat is worse
  than dropping it: a loop body reads `{{ loop_1.item }}` (one element), while a batch child is seeded with
  `{{ batch_1.items }}` — the whole chunk as an array (`fan-out-dispatcher-job.ts` → `batchStepOutput`), so
  every mention in the kept body would resolve to `undefined` with no error. The equivalent conversion is to
  keep the body *inside a new loop over `{{ batch.items }}`* and remap the old container's name to that
  loop's — the same "batches side by side, items one at a time within a batch" shape the nudge is selling.
  `addActionUtils` already has the reference-remapping half (`remapStepReferences`, used by `clone`).
- **The nested-batch guard lives in `_addAction` only, so `UPDATE_ACTION` can still nest one.** Replacing a
  step that sits inside a batch region with a batch — or converting a loop whose body holds one — produces
  nesting that no operation rejects. Adding the same post-hoc `hasNestedBatch(after) && !hasNestedBatch(before)`
  check to `_updateAction` is only half the job: the builder applies operations optimistically through the
  same `flowOperations.apply` inside a zustand `set`, so a throw there surfaces as an unhandled exception,
  not a toast. The selector has to stop offering the piece first (`pieceSelectorUtils.isInsideBatch` returns
  false for anything that is not `ADD_ACTION`).
- **Only the dispatcher can produce a child — caller-facing attribution was tried and removed.** Three
  things have to line up for a child to release its barrier: a signal row whose `refId` is that child's run id
  (bound by the compare-and-set `barrierService.claimSignal`), a `parentWaitpointId`, and a `dispatchIndex`.
  `flowRunService.dispatchChild` sets all three. An `ap-parent-waitpoint-id` webhook header once set only the
  middle one, and it was **deleted** rather than completed. Why it was wrong: the webhook controller is
  `securityAccess.public()` and the header was only format-checked, while `parentWaitpointId IS NULL` is what
  the runs list, `countByStatus`, the bulk-retry filter, platform analytics and the **billing usage report**
  key on — so any caller holding a webhook URL could run flows that executed normally but appeared on no
  surface and in no metered count, and the run still could not release anything because no signal bound its
  id. It existed only for the deleted `Fan Out to Subflows` piece action (`dispatch-to-subflows.ts`, removed in
  `988ff56413`), which ran in the engine sandbox and had no channel into run creation but the public webhook —
  header attribution and a caller-supplied dispatch key are what a piece can do instead of a transaction.
  If a caller-facing producer is ever wanted again, the sanctioned shape already exists: the per-signal
  capability URL handed out at barrier creation (`toSignalLink` →
  `POST /v1/flow-runs/:id/signals/:signalId/confirm` → `receive({ signalId })`). The caller completes a signal
  the server pre-allocated for it and creates no run at all, which is also why the resume routes and the
  confirm page refuse `isFanIn` waitpoints: external parties get per-signal capability, never barrier-level
  control.
