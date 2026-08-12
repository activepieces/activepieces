---
icon: 🪃
---

# Fan-in entry points

The [barrier](./flow-runs.md) has **one shipped caller**: the `PROCESS_IN_BATCHES` core step. The CSV piece
is still fire-and-forget and still has to be converted. This page is what a caller has to deal with — what
the shipped one dealt with, and what the next one inherits. Read decision
[000015](../decisions/000015-fan-in-is-an-event-driven-waitpoint-barrier.md) first for the barrier's shape,
and [000026](../decisions/000026-batch-children-dispatch-from-a-server-side-worker-job.md) plus
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

## The summary cannot enumerate its own healthy children at width

`signals` is inlined in the released summary only when `total <= 100`; above that only the counts travel and
`signalsTruncated` is set. Approvals are always under the bound, so decisions and reasons always land inline
in the run log. Batch fan-outs above it do not, which is why the run-detail batch browser reads children
from `flow_run` by `parentWaitpointId` + `dispatchIndex` rather than from the summary — that is the only way
to open a *succeeded* batch's logs.

Growing the summary to carry every child would reverse its payload bound (failure count, not N) *and* grow
the parent's log file with fan-out width.

Related web-side consequence: a parent-side panel cannot reuse the loop-iteration output lookup
(`extractStepOutput` → `executionJournal.getPathToStep`) for a fan-out container's body steps, because those
outputs are not in the parent's `run.steps` at all — they live in each child's own log file, fetched by child
run id. The loop *rail* presentation reuses fine; the data path underneath it does not.

## Gotchas

- **A resume link's only guard is that every segment of it is unguessable, so a per-signal link must not
  carry a caller-supplied key.** Decision 000009 states the model; the consequence for a K-of-N approval is
  severe and not obvious. The confirm route is `securityAccess.unscoped(ALL_PRINCIPAL_TYPES)`, so a semantic
  per-signal segment (`approver-a`, an email, an index) is guessable by string substitution and **one
  legitimate approver holding their own link could cast the whole quorum**. The link carries the signal's
  random `apId`; `label` is the audit name only, never the credential.
- **The release test is `EXISTS`, never `COUNT(*)`.** It stops at the first still-pending signal, so the
  common not-ready evaluation is O(1) whatever N is. Count exactly once, at release, to build the summary.
  A predicate that is "always `COUNT(*)`" pays a full index scan on every signal batch and then needs a
  coalescing job to afford what it just gave away.
- **`flow_run.dispatchIndex` is the only *durable* batch→child mapping, so the signal table cannot replace
  it.** Signals are deleted at release, so `(barrier, ordinal) → child` off `waitpoint_signal` answers only
  while the barrier is pending — and both UI readers need it afterwards: `batch-child-context-strip.tsx`
  renders "Batch N" from the *child's own row*, and the rail resolves cells through
  `?parentWaitpointId&dispatchIndex`. The column stays; only its unique index went, because dispatch
  idempotency is the signal claim now. The partial index is
  `(parentWaitpointId, projectId, dispatchIndex, status) WHERE "parentWaitpointId" IS NOT NULL` — `status`
  trails because release reads signals rather than a `GROUP BY` over runs, so `dispatchIndex` in third
  position makes both the per-click point lookup and the ordered children listing index-only.
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
