---
icon: 🪃
---

# Fan-in entry points

The [barrier](./flow-runs.md) has **one shipped caller**: the `PROCESS_IN_BATCHES` core step. The CSV piece
is still fire-and-forget and still has to be converted. This page is what a caller has to deal with — what
the shipped one dealt with, and what the next one inherits. Read decision
[000015](../decisions/000015-fan-in-is-an-event-driven-waitpoint-barrier.md) first for the barrier's shape,
and [000029](../decisions/000029-batch-children-dispatch-from-a-server-side-worker-job.md) plus
[Server-side fan-out](./server-side-fan-out.md) for the dispatcher underneath the shipped one.

**Binding constraint, settled: if it fans out, it must fan in.** No fire-and-forget fan-out action, ever.
`callFlow.waitForResponse` (a single fire-and-forget call, not a fan-out) stays as it is.

For how other platforms answered the same questions — concurrency scope, per-batch retry, quota, nesting —
see [Fan-out prior art](./fan-out-prior-art.md). Most relevant: **nothing in the industry re-attaches a
retried child to a closed parent aggregate**, so that problem is one we would be inventing.

## A. Process in Batches — shipped

The step resolves its items and makes **one** call (`POST /v1/waitpoints`, `type: BARRIER`, carrying
`barrier.fanOut`), then pauses. Everything else — chunking, batch-size clamping, signal rows, dispatch,
release — is server-side. What the step still owns is its own output shape: `{ barrierId, totalItems,
batchSize, total }` while paused, and those three batch-context fields spread onto the released
`BarrierSummary` on resume. There is no adapter — the step publishes the barrier's own shape so an
expression written against it survives a change of what the step waits on.

## B. Stream CSV to Subflows — still outstanding

Exists on `origin/feat/stream-csv-to-subflows` as a **fire-and-forget** action
(`packages/pieces/core/subflows/src/lib/actions/stream-csv-to-flow.ts` plus a bounded-window dispatcher in
`lib/fan-out.ts`, `maxInFlight: 5`). It must be converted to fan in before it ships.

Most of what the batch step needed is now free to it: the barrier, the signals, the claim, the dispatcher,
the release. Two things are genuinely different and are the whole conversion:

- **Streams are born open.** An array's signals all exist in the create transaction, so the barrier is
  sealed immediately. A stream cannot know N up front: the dispatcher inserts signals as it parses and
  **seals at the end**. Until it seals, the floor rule must not fire — that is exactly what the `sealed`
  column is for, and why it is durable rather than derived from dispatcher progress in Redis.
- **`sequence` earns its keep here.** A stream dispatcher re-entered by BullMQ redelivery re-parses from row
  0 and has to answer *"did I already insert batch 4 200?"*. The partial unique index on
  `(waitpointId, sequence)` is that answer. Array producers leave it null and rely on the barrier's own
  `(flowRunId, stepName)` key.

Still open for it: the source does not fit Fastify's `bodyLimit`, so it needs a **file** in place of the
`distributedStore` blob the array path uses, and a batch size derived so N stays under
`AP_MAX_BARRIER_SIGNALS` (a 1M-row CSV at 100/batch is exactly the 10 000 cap).

## Hard ceiling — state it, do not try to fix it

Fan-out width is capped at `AP_MAX_BARRIER_SIGNALS` (10 000). The old ceiling — one sandboxed step's
`FLOW_TIMEOUT_SECONDS` — is gone with the sandbox loop; what replaced it is the **dispatch window**, ~60 s at
the cap, during which the dispatcher holds a worker poll slot and nothing bounds it except the barrier
deadline. For `PROCESS_IN_BATCHES` the practical ceiling is the items array fitting in engine memory and
under `bodyLimit`, not dispatch throughput.

## Slice refs a barrier's children read cannot expire inside the barrier window — except one gap

Three separate pieces compose into an invariant nothing states in one place: the barrier deadline is capped
at `AP_PAUSED_FLOW_TIMEOUT_DAYS`, the startup validator (`system-validator.ts`) refuses to boot when that
exceeds `AP_EXECUTION_DATA_RETENTION_DAYS`, and per-project retention overrides are floored at the
paused-flow timeout (`project-service.ts`). So a `FLOW_RUN_LOG_SLICE` written at fan-out time outlives any
barrier deadline. The gap: the slice clock starts at *write* and is never re-armed on resume (only the run
log file is — see [file-storage](../data-storage-observability/file-storage.md)), so a parent paused between
producing a large output and reaching the fan-out step erodes the margin. A child materializing an expired
ref fails cleanly: the engine download path maps 404/410 to `EngineFileNotFoundError`, a USER-type step
failure, never `INTERNAL_ERROR`.

**The per-step timeout may only ever shorten, and that is why it is safe.** `PROCESS_IN_BATCHES` carries an
optional `settings.timeoutSeconds` (floor 1 hour, entered in whole hours in the builder) that rides
`CreateBarrierRequest` to `resolveDeadline()`, which returns `min(now + timeoutSeconds, now +
AP_PAUSED_FLOW_TIMEOUT_DAYS)`. The clamp is not defensive dressing — a deadline past the cap breaks the
slice-ref invariant above, and a Zod `.max()` cannot express it because the cap is per-deployment and the
schema is static and shared. Empty field = the cap, i.e. the old behaviour. The whole timeout *mechanism*
was already there (deadline column, `waitpointTimeoutJob`, the sweep, `timedOut` in the summary), so the
feature is plumbing plus a form field. `Continue on Failure` governs the outcome for free: off → the
timeout fails the step, on → it continues with the partial summary.

A short timeout also makes `stillRunning > 0` ordinary rather than exotic, so the "a fan-in timeout leaves
stragglers running" gotcha in [flow-runs](./flow-runs.md) is now a routine outcome, and `timedOut` had to
reach the UI — under Continue-on-failure a timed-out step is otherwise indistinguishable from a clean
success.

## The summary cannot enumerate its own healthy children at width

`signals` is inlined in the released summary only when `total <= 100`; above that only the counts travel and
`signalsTruncated` is set. Approvals are always under the bound, so decisions and reasons always land inline
in the run log. Batch fan-outs above it do not, which is why the run-detail batch browser reads children
from `flow_run` by `parentWaitpointId` + `dispatchIndex` rather than from the summary — that is the only way
to open a *succeeded* batch's logs.

Growing the summary to carry every child would reverse its payload bound (failure count, not N) *and* grow
the parent's log file with fan-out width.

### How the browser reads it instead

The `Batches` tab on a `PROCESS_IN_BATCHES` step **pages, it never enumerates**: a `useInfiniteQuery` over
`?parentWaitpointId` at 50 rows a page, and a search box that *is* jump-to-index — naming a batch fires the
O(1) `?dispatchIndex` point lookup, which is what pays for a cursor that cannot random-access. There is no N
at which the browser behaves differently; the only axis is **finished vs mid-flight**. Finished, the released
summary's seven-way breakdown draws four exact stat tiles at any width, for free. Mid-flight there are no
tiles at all — `signals` have no read endpoint and `flow_run` rows undercount while dispatch is in flight, so
every row-derived aggregate would be wrong invisibly. Per-row status stays live either way.

Clicking a row **selects** (`setBatchIndex`); it never navigates. Selection is a bare `dispatchIndex` in the
builder store, so a batch with no child run at all is still selectable, and every body step node on the canvas
re-resolves through `useStepOutputInRun`. That is also why the Detail block carries no step timeline: the
canvas already is one — it renders the row's `failedStep` column plus the batch's own duration, both free
off the list row, and no per-step clock (see [flow-runs](./flow-runs.md) for why that one cannot exist).

Related web-side consequence: a parent-side panel cannot reuse the loop-iteration output lookup
(`extractStepOutput` → `executionJournal.getPathToStep`) for a fan-out container's body steps, because those
outputs are not in the parent's `run.steps` at all — they live in each child's own log file, fetched by child
run id. The loop *rail* presentation reuses fine; the data path underneath it does not.

## Gotchas

- **`startTime` is reported from the trigger path only, so any run entered at a step never had one.**
  Surfaced as "every barrier child has `startTime = NULL`" (verified against a live 10-batch run: `created` and
  `finishTime` set on all children, `startTime` on none, while ordinary runs in the same project all have it) —
  but the cause is not fan-in specific. `flowExecutor.executeFromTrigger` is the **only** caller that ever
  passes a `startTime` to `flowRunProgressReporter.sendUpdate` (`flow-executor.ts`, inside its
  `ExecutionType.BEGIN` branch), and the reporter's `savedStartTime` is what later rides
  `UploadRunLogsRequest.startTime` into the column. `flow.operation.ts` routes any operation carrying an
  `entryStepName` **straight to `flowExecutor.execute`**, bypassing `executeFromTrigger` entirely — so the
  field is never sent and `spreadIfDefined('startTime', …)` in `runsMetadataQueue` never writes it. Fixed by
  reporting the start time on the `entryStepName` branch too, guarded to `BEGIN` so a child's resume cannot
  clobber it. The earlier guess that `dispatchChild`'s pre-insert was to blame was **wrong** — the update-vs-insert
  branch is a red herring; both paths write `startTime` the same way, one just never receives it. Do not paper
  over a missing duration with `finishTime - created`: that is queue wait plus run, a different quantity.
- **`truncateFailedStepMessage` cuts a JSON envelope mid-string, so `failedStep.message` often will not parse.**
  A piece failure serializes as `{"__apErrorVersion":1,"message":…,"raw":…}` and the column is capped at 700
  chars — with `raw` carrying a stack trace, real messages land at exactly 701 chars and
  `tryParseFriendlyPieceError` correctly returns null, leaving a raw JSON blob on screen. The step *panel* is
  unaffected because it reads `stepOutput.errorMessage` from the log file, which is not truncated; only readers
  of the `failedStep` **column** are bitten. `batchUtils.failureMessage` works around it by recovering the
  `message` field from the prefix. The real fix is to truncate `raw` *inside* the envelope before serializing,
  so the JSON stays valid.
- **The batch step's `stepOutput.duration` is the *resume leg*, not the fan-out.** `resumeWithSummary`
  (`process-in-batches-executor.ts`) builds a **fresh** `GenericStepOutput` with a fresh
  `stepStartTime = performance.now()`, so the duration that finally lands is the milliseconds spent parsing
  the released summary — not the minutes the children actually took. The paused leg's duration is likewise
  just the `POST /v1/waitpoints` round trip. So "this fan-out took 3m 41s" has **no source**: the summary
  carries counts and no timestamps, and deriving it from the children (`max(finishTime) - min(startTime)`)
  is wrong under paging, which only ever holds one 50-row page. A design asking for it should ship the half
  that is data (`Split 1,000 items, 10 each`) and drop the half that is not — the same call
  [flow-runs](./flow-runs.md) records for the per-step clock. The canvas step node renders this duration
  today and is telling the truth about the wrong thing.
- **A resume link's only guard is that every segment of it is unguessable, so a per-signal link must not
  carry a caller-supplied key.** Decision 000009 states the model; the consequence for a K-of-N approval is
  severe and not obvious. The confirm route is `securityAccess.unscoped(ALL_PRINCIPAL_TYPES)`, so a semantic
  per-signal segment (`approver-a`, an email, an index) is guessable by string substitution and **one
  legitimate approver holding their own link could cast the whole quorum**. The link carries the signal's
  random `apId`; `label` is the audit name only, never the credential.
- **Truncation drops the `signals` array and nothing else — the full seven-way count breakdown always
  travels, so a "N batches · N succeeded · N failed" header is free at any width.** "Only the counts travel"
  reads like a total plus a failure count; it is `total`, `succeeded`, `failed`, `rejected`, `canceled`,
  `notDispatched`, `stillRunning`, `timedOut` — exact, from one `GROUP BY status` inside the release
  transaction (`buildSummary`, `barrier-service.ts`), and republished verbatim as the step's own output
  (`BatchStepSummary`). The corollary is the real constraint: **a *pending* barrier has no breakdown at all.**
  Signals are the only per-batch outcome while pending and `waitpoint-controller.ts` exposes no read route
  (only `POST /`), then they are deleted at release; and `flow_run` rows undercount mid-flight, because
  dispatch is progressive (5 in flight) and a `NOT_DISPATCHED` signal never produces a row. Any live counter
  must render its own incompleteness ("30 of 412 dispatched") rather than imply a breakdown. The dividing
  line for a UI is finished vs mid-flight, not `total` ≶ 100.
- **The batch step's own pass/fail verdict is a second, hand-written tally of the summary — keep it in step
  with `UNFAVOURABLE_SIGNAL_STATUSES`.** `resumeWithSummary` (`process-in-batches-executor.ts`) sums
  `failed + rejected + canceled + notDispatched` into `unsuccessful` and fails the step unless
  `continueOnFailure` is on. That list must mirror `UNFAVOURABLE_SIGNAL_STATUSES` in `core-execution`, which
  the release predicate already uses — they drifted once (`canceled` omitted), and the miss is invisible in
  the common case because a canceled *parent* never resumes. It only shows when a single child is canceled on
  its own while the barrier stays pending: the barrier releases with `canceled > 0` and the step used to pass
  as clean. `stillRunning` deliberately stays out of the tally — an early policy release is a success shape,
  which is why `timedOut` is checked separately.
- **A UI-side `COUNT` over a barrier's children is fine — the `EXISTS` gotcha below is about the release
  loop, not about reads.** `GROUP BY status` on one barrier is an index-only scan of at most
  `AP_MAX_BARRIER_SIGNALS` tuples on `idx_run_parent_waitpoint_id`, once per poll. But
  `flowRunService.countByStatus` cannot serve it as written: it hardcodes `parentWaitpointId: IsNull()`
  specifically to keep barrier children out of the runs-list counters, and `SeekPage` carries no total, so
  `list` cannot substitute.
- **The release test is `EXISTS` for every barrier that does not need arithmetic, and the gate is a named
  function, not an inline condition.** `barrierService.evaluate` asks
  `barrierReleasesOnLastPendingSignal({ policy, sealed })` — sealed, no `requiredSuccesses`, no
  `releaseOnFirstFailure` — and on the true branch runs `signalRepo().existsBy({ waitpointId, projectId,
  status: PENDING })`, one `SELECT 1 … LIMIT 1`. Only a counting policy falls through to
  `countSignalsByStatus`; the exact breakdown otherwise stays in `buildSummary`, inside the release
  transaction. The gate lives beside `shouldReleaseBarrier` in `core-execution` on purpose: it *is* the
  claim "this predicate reduces to PENDING === 0", and the unit test asserts the two agree rather than
  restating the truth table, so adding a counting policy field without updating the reduction fails the
  build. Before this, `evaluate` counted unconditionally and the coalescing job did not pay for it —
  `processBarrierJob` clears the deduplication key at job *start*, so each child finishing afterwards
  re-arms another evaluation, making it ~N evaluations × N rows. See [flow-runs](./flow-runs.md) for the
  full accounting.
- **`flow_run.dispatchIndex` is the only *durable* batch→child mapping, so the signal table cannot replace
  it.** Signals are deleted at release, so `(barrier, ordinal) → child` off `waitpoint_signal` answers only
  while the barrier is pending — and both UI readers need it afterwards: `batch-child-context-strip.tsx`
  renders "Batch N" from the *child's own row*, and the batch browser resolves a picked batch through
  `?parentWaitpointId&dispatchIndex`. The column stays; only its unique index went, because dispatch
  idempotency is the signal claim now. The partial index is
  `(parentWaitpointId, projectId, dispatchIndex, status) WHERE "parentWaitpointId" IS NOT NULL` — `status`
  trails because release reads signals rather than a `GROUP BY` over runs, so `dispatchIndex` in third
  position makes both the per-click point lookup and the ordered children listing index-only.
- **A children listing can be paged or point-looked-up, never randomly accessed or counted.** `?parentWaitpointId`
  switches `flowRunService.list` to `dispatchIndex ASC, id ASC` and cursor-paginates it, but `dispatchIndex` is an
  *exact-match* filter (`flow-run-service.ts:76-78`) with no range form, the cursor is an opaque
  `base64('next_' + base64({dispatchIndex, id}))`, and `SeekPage` carries no total. So "jump to batch 7,431" is a free
  O(1) point lookup, "scroll to row 7,431" needs a new `dispatchIndexGte` param, and any filtered list is uncountable —
  a count has to come from the released summary or from nowhere. Wide fan-out UIs should page + point-look-up rather
  than virtualize over the whole range.
- **Batch selection is one global map, not per-surface state, so a picker only ever needs to exist once.**
  `batchesIndexes: Record<stepName, dispatchIndex>` lives in the builder store (`run-state.ts`) and
  `useStepOutputInRun` already resolves *every* step inside a batch body through it — pick a batch anywhere
  and each body step you click afterwards reads that child run. A second picker carried on body steps buys
  visibility, never function; a breadcrumb is enough. The corollary bites the other way too: there is no
  per-step batch, so two panels can never disagree about which batch is open.
- **Changing the selected batch blanks every body step node until the child run loads.** Same hook, one step
  further: `useStepOutputInRun` returns `undefined` whenever `BatchLogs.kind === 'loading'`, and
  `useBatchChildRun` refetches on every `setBatchIndex`. Both canvas readers (`step-node-status-in-run.tsx`,
  `step-node-run-duration-and-piece-name.tsx`) therefore de-paint together for the round-trip — a whole-canvas
  flash, not a local spinner. `setBatchIndex` has no callers yet, so nobody has seen it; the first one to wire
  a picker will. `placeholderData: keepPreviousData` on `useBatchChildRun` holds the old batch's steps until
  the new ones land (precedent: `use-global-search-results.ts:84`). Do not confuse this with a batch that
  legitimately has no logs — `neverStarted`, `failedToDispatch`, `stillRunning`, `logsExpired` each have their
  own copy in `missingLogsCopy` (`batch-utils.ts`), and a blank canvas is the *correct* render for those.
- **A batch step nested inside another batch's body resolves no output in the builder, so no batch UI reaches
  it — even though the engine allows unbounded nesting.** `useBatchStepRun` reads `state.run.steps`, i.e. the
  *parent* run, while an inner `PROCESS_IN_BATCHES` step's output lives in the outer batch's **child** run's
  steps. `extractStepOutput` therefore returns `undefined`, `parseStepOutput` yields `null`, and the step
  falls through to `notInABatch`. The fix is recursive resolution (feed the outer batch's child-run `steps`
  back into the inner lookup), not a change to `batchesIndexes` — keying by step name is already correct,
  since step names are unique per flow version.
- **A loop pinned inside a batch body dangles when the batch changes, and the loop rail lies rather than
  emptying.** `loopsIndexes` and `batchesIndexes` are independent maps that meet in `useStepOutputInRun`: the
  batch picks *which child run's* steps are read, the loop then indexes *into* them. Switching from a batch
  whose loop ran 20 iterations to one that ran 4 leaves the pin at 12, `getStateAtPath` throws on
  `iterations[12]`, and `extractStepOutput` swallows it to `undefined`. Body loops are never re-pinned
  automatically — `pinLoopsToIterationsWithFailedStep` / `snapLoopsToLatestIteration` walk the *parent* run,
  which holds no batch body steps — so an explicit `setLoopIndex` click sits there across every batch switch.
  The visible result is not a clean empty state: `LoopIterationInput` reads the same hook, so its dot rail
  repaints to the new child's 4 while the number input still renders 13 against `max=4`. Clamp at **read**, in
  `executionJournal.getPathToStep` (`execution-journal.ts:149`), where `iterations.length` is already in hand —
  that seam covers every `extractStepOutput` caller, closes the `undefined`-index hole in the same expression,
  and has one non-test caller repo-wide (the engine journals via `upsertStep`/`getStep`). Never reset and never
  write back: the store keeping the stale 12 is what restores your place when you switch back, and a converging
  write-back is only knowable after the child loads, i.e. the `useEffect`-on-value-change `packages/web/CLAUDE.md`
  forbids. Note the symmetry — the mirror case, a batch *inside a loop* sharing one index across iterations,
  is already read-clamped at `use-batch-logs.ts:36`.
- **The deadline is set at create, not at seal.** A barrier that got its deadline at seal was invisible to
  the sweep until sealed — safe only while the parent went PAUSED *after* the seal returned. The moment a
  dispatcher pauses the parent before its children exist (which is now the shipped shape), that accident ends:
  a PAUSED run, an unsealed barrier, no deadline and no sweep coverage until retention deletes it.
- **A retried child must never inherit `parentWaitpointId`.** `retry(ON_LATEST_VERSION)` copies `parentRunId`
  only; `FROM_FAILED_STEP` retries in place. A run with a `dispatchIndex` refuses mid-graph retry outright —
  retry the parent instead.
- **Barrier children are hidden from the runs list** (`parentWaitpointId IS NULL` on the default list), which
  is also why cancelling the parent has to stop the dispatcher: children created after a cancel would run
  user steps, bill tasks and AI credits, and never show up.
- **A released barrier used to still admit children — `dispatchChild` now checks status, not just existence.**
  `release` deletes the signal rows but leaves the waitpoint `COMPLETED` until a later, lock-guarded delete, and
  the dispatcher checks the barrier exactly once, before its loop. So a claim that won just before the delete
  reached `dispatchChild`, whose guard was `isNil(barrier)` — a `COMPLETED` barrier passed, and the child was
  created against a released barrier: billed, hidden from the runs list (`parentWaitpointId IS NULL` on the
  default list), its outcome discarded by `receive`. The fix is `isNil(barrier) || barrier.status !== PENDING` at
  that one chokepoint, which every dispatch path routes through; the dispatcher's existing `isBarrierGone` catch
  turns the throw into a clean stop, so no new mechanism was needed. Configurable timeouts are what made this
  reachable — at the 30-day default the window never opened.
- **A barrier test that counts children must pause the barrier queue first.** `barrierService.create` enqueues a
  real `addFanOutDispatch`, and the integration environment runs live barrier workers — so children appear from
  the background job, not from the `handleFanOutDispatch` the test called. Two tests written against release-mid-
  dispatch failed with "expected 0, got 4" for exactly this reason. Wrap the body in the queue
  `pause()`/`drain(true)`/`resume()` dance (`withBarrierQueuePaused` in `barrier.test.ts`) whenever the assertion
  is about which children exist. The pre-existing "stops without dispatching when the barrier was cancelled" test
  dodges it only by accident: it deletes the waitpoint, which makes the background dispatcher fail fast too.
- **There is no `barrierService.listChildren`, and planning docs that price one in are wrong.** Enumerating a
  barrier's children is `GET /v1/flow-runs?parentWaitpointId=…` — `flow-run-controller.ts:31` →
  `flow-run-service.ts:74`, riding the partial index above; web already wraps it as `useBatchChildrenPage` /
  `useBatchChild` (`flow-run-hooks.ts`, 7s poll). `barrier-service.ts` exposes no children accessor at
  all and does not need one, because the durable mapping lives on `flow_run`, not on the barrier. The trap is
  that `grep -r listChildren packages/` looks like it exists: the hits are a stale
  `packages/server/api/dist/**/fan-in-barrier.d.ts` from the pre-rename design and a same-named test helper
  in `barrier.test.ts`. Check `src/`, not `dist/`, before scoping a server ticket to "add the children
  endpoint" — it is already there.
