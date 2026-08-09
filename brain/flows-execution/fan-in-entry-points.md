---
icon: 🪃
---

# Fan-in entry points

The [fan-in barrier](./flow-runs.md) ships **dormant** — the server-side join is complete and no piece
calls it. This page is what the first caller has to deal with. Read decision 000015 first for why the
barrier is shaped the way it is; everything here is downstream of that.

**Binding constraint, settled: if it fans out, it must fan in.** No fire-and-forget fan-out action,
ever. `callFlow.waitForResponse` (a single fire-and-forget call, not a fan-out) stays as it is.

For how other platforms answered the same questions — concurrency scope, per-batch retry, quota, nesting — see
[Fan-out prior art](./fan-out-prior-art.md). Most relevant here: **nothing in the industry re-attaches a
retried child to a closed parent aggregate**, so the re-attachment problem below is one we are inventing.

### The two candidates

**A. Stream CSV to Subflows.** Exists on `origin/feat/stream-csv-to-subflows` as a **fire-and-forget**
action (`packages/pieces/core/subflows/src/lib/actions/stream-csv-to-flow.ts` plus a bounded-window
dispatcher in `lib/fan-out.ts`, `maxInFlight: 5`). It must be converted to fan in before it ships.
Children go through `POST /v1/webhooks/:flowId` to a *separate* flow carrying a Callable Flow trigger.

**B. Process in Batches step.** A new **`FlowActionType.PROCESS_IN_BATCHES`** core action — a loop-shaped container
whose nested body is a *section* of steps, batched out to child runs.

- **Not** a `LOOP_ON_ITEMS` mode. Costs a case in ~43 live sites that branch on `LOOP_ON_ITEMS` — but
  **no `LATEST_FLOW_SCHEMA_VERSION` bump**, an early assumption since overturned (see the bump gotcha on
  [flows](./flows.md)); buys honest semantics — a loop's output is per-iteration results, a
  batched fan-out's is a fan-in summary, and conflating them is a silent output-shape change.
- Children run the **parent's** `flowVersionId` starting at a section entry step. `flowExecutor.execute()`
  already starts from any action node (`packages/server/engine/src/lib/handler/flow-executor.ts`), and
  `stepNameToTest` is existing precedent for executing a subset of a version. No hidden flow rows, no
  publish-time sync problem, no orphans when the section is deleted. The body terminates itself
  (`nextAction` is null at the end of the nested chain), so no exit marker is needed.
- **Section inputs**: statically extract the body's `{{ stepX.* }}` references at dispatch and resolve
  them from the parent's live state, so only what is referenced travels. **The utility already exists** —
  `extractReferencedStepNames` in `packages/server/engine/src/lib/variables/props-resolver.ts` (substring
  match of the flow's step names against the JSON-stringified unresolved input) feeding
  `FlowExecutorContext.currentState(referencedStepNames)`, which is how *every* step in *every* run already
  resolves. What is missing is only the union over a body section rather than one step's input; an earlier
  version of this page wrongly said no utility existed and pointed at `flowStructureUtil.transferStep`.
  A token can only resolve if its step name appears literally in the unresolved input, so that union is a
  **provable superset** of what any body step could address — referenced-only is parity with a full
  snapshot, not a narrowing of it. Code steps do not weaken this: `code-executor.ts` passes
  `inputs: resolvedInput` (the step's declared `settings.input` only), so there is no broad context handle.
- **Dispatch runs in the engine sandbox** against a new `POST /v1/flow-runs/dispatch`. These children
  cannot use `POST /v1/webhooks/:flowId` — that resolves the *published* version and runs a trigger.
  Rejected alternative: a server-side fan-out job (materialises the whole item list to storage and adds
  a job type).

### What the first entry point forces

- **Version floor — CSV piece only.** `sealFanIn` was added to `RunContext` without bumping
  `ContextVersion` / `MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION` (see the contract comment
  in `packages/pieces/framework/src/lib/context/versioning.ts`). Harmless while nothing calls it. Once a
  piece does, a registry piece on a server below the floor gets `isFanIn` silently dropped → the parent
  pauses on a plain webhook waitpoint nothing resumes → a multi-day hang, not an error. The floor is
  piece-wide and framework-wide, so a runtime `typeof context.run.sealFanIn === 'function'` guard
  **before** creating the barrier or dispatching anything is the targeted alternative. **Does not apply
  to `PROCESS_IN_BATCHES`** — a core executor ships with the engine, so there is no piece-registry skew.
- **Bounded dispatch concurrency** — reuse `fan-out.ts` (`maxInFlight: 5`) from the CSV branch.
- **Execution concurrency needs no new cap, and children are *not* exempt from the existing one.**
  `rate-limiter-interceptor.ts` already limits per project — key is `concurrencyPool(projectId) ?? projectId`,
  limit is plan-derived on Cloud (Standard 5 → Enterprise 30) or `AP_DEFAULT_CONCURRENT_JOBS_LIMIT` (5)
  elsewhere, over-cap jobs are delayed and demoted to `lowest` rather than dropped. It keys on
  `WorkerJobType.EXECUTE_FLOW`, which every fan-out child becomes, so a parent fanning out to 10k children
  does **not** bypass its project's limit (n8n exempts sub-workflows; we do not). `RunEnvironment.TESTING` is
  exempt, so test-step batches are unlimited. Flag `AP_PROJECT_RATE_LIMITER_ENABLED` defaults to `false`
  self-hosted; the platform bound is physical either way — worker *is* the sandbox, so replica count caps it.
- **Throughput has a knee at `batch count ≈ available concurrency`, so batch count is not a "bigger is
  better" knob.** Below the knee slots idle and throughput is genuinely lost. Above it wall clock is **flat**
  — 100 batches × 10 items and 5 batches × 200 items both take 200 item-times through 5 slots — while
  overhead rises linearly: child `flow_run` rows, dispatches, barrier re-evaluations, and entries into the
  shared `runs_metadata_<runId>` lock. Counter-pressure keeps the knee from being the whole answer: a failed
  batch re-runs all of its items, and one batch must finish inside `FLOW_TIMEOUT_SECONDS`. Consequence for
  sizing guidance: the ideal batch size is a function of array length *and* the project's concurrency, so it
  cannot be baked into a static default. Consequence for single-worker installs: concurrency is 1, so a
  batched fan-out buys no throughput at all there — only overhead and a barrier.
- **Execution concurrency needs no new mechanism — but read its default before relying on it.**
  `rateLimiterInterceptor` (`workers/job-queue/interceptors/`) already caps concurrent `EXECUTE_FLOW`
  jobs on a key (`concurrencyPool(projectId) ?? projectId`) under a static plan-derived limit, and
  queues rather than drops (`REJECT` → `moveToDelayed`, demoted to `lowest` priority). **Children are
  not exempt** — every dispatched child becomes an `EXECUTE_FLOW` job, so a fan-out is metered like any
  other run of that project. That is the opposite of n8n, which exempts sub-workflow executions
  entirely (see [Fan-out prior art](./fan-out-prior-art.md)). Two gotchas: `AP_PROJECT_RATE_LIMITER_ENABLED`
  defaults to **`false`**, so a self-hoster has no cap unless they set it; and `RunEnvironment.TESTING`
  is skipped, so a test-step batch is never throttled.
- **The child cap is `AP_MAX_FAN_IN_CHILDREN`, default 10000** (was a hardcoded 1000 in the zod schema;
  now an app system prop enforced in `waitpointService.sealFanInBarrier` against
  `expectedChildren + failedToDispatch`, and pre-flighted at *create* against the optional
  `intendedChildren` the dispatcher declares — so an over-cap fan-out is refused with zero children
  dispatched, not after thousands are already running. The cap value never enters the sandbox: the engine
  sends a count, the server owns the limit, and the refusal is a 409 the engine's waitpoint client maps to
  a USER-type step failure). A 1M-row batched fan-out at 100/batch still lands exactly on
  the default, so a self-hoster running wider has to raise it — and past ~10k the runs-metadata lock
  becomes the real bottleneck (see below).
- **Operability — shipped.** Every release emits `fanIn: { barrierId, expectedChildren, releaseReason,
  stragglers }` on the ambient wide event, so "which barriers released this week and why", "how many
  children did each expect" and "how many stragglers did each leave" are one query. `releaseReason` is
  `predicate | timeout | seal`; the straggler count is the `stillRunning` the release path already
  computed, so no extra query. There is no `latencyMs` — add it against a concrete dashboard need.
  The single emit site is `waitpointService.completeFanInBarrier`, gated on `completedExisting` so a
  losing evaluator in a race emits nothing and each barrier releases exactly once in the logs. The
  deadline sweep is deliberately silent: it only re-arms the BullMQ job and never calls
  `completeFanInBarrier`.
  Two of the three release sites needed a scope first — **`wideEvent.set()` is a silent no-op outside an
  active `wideEvent.run()`** (`packages/server/utils/src/wide-event.ts`, an `AsyncLocalStorage` wrapper) —
  so the `runsMetadataQueue` worker (predicate release) and the `systemJobsSchedule` worker (timeout
  release) now each open one, mirroring what `worker.ts` does for job execution. The seal already ran
  inside an HTTP request.
  **Per-child attribution is one field, not a second event stream**: `parentWaitpointId` rides
  `ExecuteFlowJobData` (optional, so pre-upgrade jobs still parse) from `addToQueue`, and the worker seeds
  `fanIn: { barrierId }` into the per-job wide event beside the run, flow and project ids — so "every child
  of barrier X" is `fanIn.barrierId = X`, the same filter that finds its release event. The runs-metadata
  worker's own event carries it too, which covers a child whose job predates the field.
- **`ap-parent-waitpoint-id` is stamped from an unauthenticated header with no ownership check.**
  `webhook-request-converter.ts` validates the *format* only — nothing checks the waitpoint exists, is
  `isFanIn`, is PENDING, or belongs to the flow's project. Cross-tenant is blocked by `countChildren`'s
  `projectId` filter (deliberate — keep it); intra-project injection into a known barrier id is not.
  Validate at run creation and drop the attribution if it does not resolve.
- **`ap-dispatch-key` is namespaced per project before it becomes a BullMQ job id.** The default queue is
  `QueueName.WORKER_JOBS`, shared across platforms unless worker groups are enabled, so a caller-controlled
  key alone would be a cross-tenant id. `webhook.service.ts` enqueues
  `` `${flow.projectId}-${dispatchKey}` `` → `job-queue.ts` (`jobId: params.id`). The separator is `-`, not
  `:`, because BullMQ rejects a custom job id containing `:` (`Custom Id cannot contain :`); `projectId` is
  a fixed-length 21-char `ApId`, so the prefix is still unambiguous and dedup keeps working within a
  project.
- **Create and seal were one endpoint discriminated by the absence of a field — split, and now closed.**
  `isFanIn` plus a nil `expectedChildren` meant create and a present one meant seal, so a caller that
  sensibly tried create+seal in one call got "The fan-in barrier for this step no longer exists" — an
  error describing the opposite of what happened. Now `POST /v1/waitpoints` creates and
  `POST /v1/waitpoints/:id/seal` seals, addressed by id. Two things rode the split:
  - **The ceiling ask is omission.** `PROCESS_IN_BATCHES` seals at `now + AP_PAUSED_FLOW_TIMEOUT_DAYS`, and
    the sandbox cannot compute that value (the env var is deliberately not propagated in), so `timeoutAt`
    on the seal request is **optional and omitting it means the ceiling**. It is deliberately *not*
    "send a far-future date and let `clampFanInTimeout` clamp" — that fires the clamp warn on every
    legitimate run and turns a misbehavior signal into noise. An earlier version of this page said the ask
    had to be distinct from omission because a forgot-caller 1-hour fallback already claimed it; **no such
    fallback exists in the code**, and once seal was its own endpoint `timeoutAt` was required there, so
    omission was unclaimed. The seal response returns the effective post-clamp `timeoutAt` — the engine
    could not previously learn its own deadline.
  - **Create returns the barrier's re-entry state.** An optional `fanIn: { sealed, expectedChildren,
    dispatchedIndices }` block, present only for fan-in creates, so the dispatcher can tell fresh from
    "sealed, N expected" from "partially dispatched, these indices already went".

### The dispatch transport — `POST /v1/flow-runs/dispatch`, shipped

Batch children **cannot** ride `POST /v1/webhooks/:flowId`: that resolves the *published* version and runs a
trigger, while a batch child must run the **parent's** version from the body's entry step. So there is one new
engine-only endpoint, and it is the only new endpoint the feature needs.

- The request is `{ parentRunId, entryStepName, seedSteps, parentWaitpointId?, dispatchIndex, dispatchKey }`.
  **Project scope comes from the engine principal, never the body** — the flow version, flow id and
  environment are all derived from the parent run row, so a caller cannot point a child at another project.
- The child row is **saved synchronously** (not through `runsMetadataQueue`, which is async), then queued;
  if queueing throws, the row is deleted so a pre-created row can never hang as a permanently `QUEUED` child.
- **The insert is idempotent per `(parentWaitpointId, dispatchIndex)`** — `ON CONFLICT DO NOTHING` against
  the unique partial index `idx_run_parent_waitpoint_dispatch_index`, then read the row back by barrier and
  index; a second dispatch of an index this barrier already has returns the existing child id and queues
  nothing. Without it the BullMQ dispatch key deduped the *job* but not the *row*, so a re-dispatched index
  left a phantom `QUEUED` child that never runs and never turns terminal — the barrier then waits out
  `AP_PAUSED_FLOW_TIMEOUT_DAYS` instead of releasing.
- `entryStepName` rides on the **BEGIN** job data and operation, and the seed rides in the ordinary
  `payload` slot (so it offloads to a file when large). In `flow.operation.ts` a BEGIN carrying an entry step
  restores the seed instead of building a trigger step, then calls `flowExecutor.execute()` from that action —
  the body chain ends itself, so the child terminates at the end of the section with no extra bookkeeping.
- Queue job id is `` `${projectId}-${dispatchKey}` `` — the default queue is shared across platforms, so the
  caller-supplied key alone would be a cross-tenant id, and the separator must be `-` (a custom BullMQ job id
  rejects `:`).
- Barrier attribution is validated at creation and **dropped** if it does not resolve in the project, rather
  than failing the dispatch. **A 201 is therefore not proof the child joined the barrier** — a dispatcher that
  ignores `attributedToBarrier` counts an unattributed child toward `expectedChildren` that `countChildren`
  can never see, and the parent waits out `AP_PAUSED_FLOW_TIMEOUT_DAYS`. `PROCESS_IN_BATCHES` treats
  `attributedToBarrier: false` as a dispatch failure so the seal expects one fewer child; the orphan runs on.

### The dispatch loop is resumable on the `PROCESS_IN_BATCHES` path — shipped

If the dispatching step dies mid-loop (sandbox timeout, killed worker, flow timeout) the parent re-enters
the step and **dispatches only the complement of the indices the barrier already has**, then seals. The
CSV piece has none of this: it still hits the blunt "children present → throw".

Two clauses have to hold, and neither of them separates CSV from `PROCESS_IN_BATCHES`.

**1. The resume index must come from the set of dispatched indices, never from the child count.**
Dispatch is concurrent (`maxInFlight: 5`) so completions land out of order, and child rows materialise
two BullMQ hops after acceptance anyway — so the count is not a watermark. Die with batches 900–904 in
flight where only 902 and 903 landed and the count reads 902: resuming there re-dispatches 902–903 *and
permanently drops 900, 901, 904*. Silent data loss, worse than the duplicate it was avoiding.

The index already exists in `ap-dispatch-key: <barrierId>-<index>`, but `webhook.service.ts` only feeds
it to a BullMQ `jobId` and jobs are removed on completion — nothing persists it. Store it beside
`parentWaitpointId` on `flow_run` and dispatch the complement of the present set. The dedup key then
covers exactly the window the rows do not: index present → skip; index absent but job queued/active →
dispatch and the key swallows it; index absent and job gone → genuinely needs dispatching.

`flow_run.dispatchIndex` and `waitpoint.dispatchDigest` are **shipped columns**
(`1821000000000-AddDispatchTrackingToFanIn`), `POST /v1/flow-runs/dispatch` writes the index, and
`fanInBarrier.listChildren` reads the set as rows — never a `COUNT` or a `MAX`. **The webhook path still
does not write it**, so `dispatchedIndices` is `[]` for a CSV-piece barrier; an empty array means "no
index-writing dispatcher has run", not "no children were dispatched".

The dispatcher computes the complement in the engine
(`process-in-batches-executor.ts`: `missingIndices` over `fanIn.dispatchedIndices`) and never derives a
resume point from a count. `fanIn.sealed` short-circuits it to an empty complement: a barrier that already
carries an `expectedChildren` finished dispatching, so re-entry dispatches nothing and only re-pauses —
dispatching a previously failed-to-dispatch index at that point would add a child the sealed
`expectedChildren` does not account for and make the released counts sum wrong.

**2. The source must be stable bytes.** Batching is *deterministic* — `fanOutBatches` derives
`batchIndex` from position alone and `createCsvParser` is pure given the same `delimiter`, so the same
bytes and the same `batchSize` always yield the same batch *k*. Re-entry therefore never seeks: it
re-parses from row 0 and discards the first *k* batches undispatched, at ~µs/row against ~2ms/batch of
dispatch. **A stream being unseekable is not the blocker** — the earlier finding here had the wrong
reason. What does break is an unstable *source*: `Property.File({ streaming: true })` also accepts a URL,
and a pre-signed link expires, `latest.csv` changes, an export endpoint regenerates in another row order.
Uploads and previous-step files are stored bytes and resume exactly as well as an items array, so the
CSV caveat shrinks to rejecting (or warning on) non-stored sources.

For `PROCESS_IN_BATCHES` clause 2 is **enforced, not assumed**: the dispatcher sends a sha-256 of the
dispatched payload (extracted seed union + resolved items) on `POST /v1/waitpoints`, it is persisted on
the barrier at creation, and re-entry fails the parent on mismatch before dispatching further — match is
what proves complement dispatch safe.

**The server compares the digest, not the engine — shipped in `assertReEntryIsSafe`.** `createFanInBarrier`
throws when a barrier that already has children is re-entered with a different digest, and the throw happens
inside the create transaction *before* any leftover-barrier delete, so the mismatched parent fails with its
already-dispatched children still attributed to the old barrier and still running. A stored `null` digest
(a row predating the column) keeps the older, blunter "children present → throw". The server never learns what the items are — it
compares two opaque hashes. This inverts the original design, which had the server return the stored digest
and the dispatcher compare: the guard is the only thing between a re-entering dispatcher and duplicate
children, and a guard in the caller is one the caller can forget. Sending a digest is therefore mandatory
for `isFanIn` creates.
Expression-content inspection was rejected: a BEGIN redelivery re-executes the whole prefix (see the
flow-runs page), so instability can enter through any non-idempotent upstream step, invisible to any
static check — and the formula registry's non-deterministic function list is five, not three (see the
formulas page).

(Re-entry into an already-sealed barrier no longer hard-fails the run — the once-only seal made that a
logged no-op. What `POST /v1/waitpoints` returns is settled above: the optional `fanIn` block.)

### Retry and resume both re-enter the dispatch loop, and the barrier is gone by then

Three ways back into a dispatching step — normal release, crash mid-dispatch, user retry — and the
persisted dispatch index above is what makes all three one code path: dispatch the complement of the
present indices, skip the re-seal when already sealed. Normal release yields an empty complement, so
"emit the summary, dispatch nothing" needs no separate branch. Constraints that path has to respect:

- **The barrier row does not survive to retry time.** Resume deletes it (`handleResumeSignal`, PAUSED
  branch), `retry` with `FROM_FAILED_STEP` calls `waitpointService.deleteByFlowRunId` before
  re-queueing, and re-entry discards a leftover COMPLETED barrier for the step. So "reuse the previous
  barrier" means keeping `isFanIn` rows COMPLETED instead of deleting them, exempting them from retry's
  wipe, and path-keying the discard. Resume also needs the row for its `resumePayload` summary.
- **But barrier reuse is only needed to re-run a *subset* of children — and every constraint in this list is
  a cost of it.** A retry that re-dispatches *all* children needs none of them: the wipe plus the
  leftover-COMPLETED discard already hands the retry a **fresh** barrier, and because `parentWaitpointId` has
  no FK the previous attempt's children stay attributed to the now-deleted barrier id, so they are invisible
  to the new predicate. `countChildren` stays `COUNT(*)`, the deadline and the `<barrierId>-<index>` dispatch
  keys are fresh, and the parent re-extracts each child's seed from its own restored state — which removes the
  "persist the child's entry step and seeded prior-step state before any retry" prerequisite too. Only
  path-keyed identity survives, for its own loop-iteration reason. The whole cost of subset-retry is that one
  choice; price it there, not across six places.
- **A mid-graph child is retryable by id, and `FROM_FAILED_STEP` on it is wrong.** Children are real
  `flow_run` rows and `POST /v1/flow-runs/:id/retry` guards only the retention window, so anyone holding a
  child's id can retry it — and since the strategy walks from the trigger rather than starting at the child's
  entry step, it re-executes the parent flow's whole prefix inside the child. An entry point that dispatches
  mid-graph children has to refuse retry for a run that started mid-graph.
- **`flow_run.parentWaitpointId` has no FK** — a plain `varchar(21)`. The id keeps grouping children
  after the row is deleted, so attribution is durable even though the barrier is not.
- **Path-keyed identity separates a retry from a new attempt.** Loop iteration N+1 is a different path
  and must get a fresh barrier; a retry re-runs the same path and must reuse it. Step name alone cannot
  tell them apart — a second reason for path-keying beyond nesting.
- **Retrying one failed child adds a second row for the same index**, and `fanInBarrier.countChildren`
  counts rows. `terminal >= expectedChildren` then double-counts that index and the summary reports the
  superseded failure. Roll up latest-attempt-per-index instead of `COUNT(*)`. The once-only seal keeping
  the original `expectedChildren` is then correct rather than a bug.
- **A reused sealed barrier keeps its original `resumeDateTime`**, now in the past, so the sweep releases
  it immediately with stragglers. Retry has to re-arm the deadline.
- **`FROM_FAILED_STEP` is not "start at step X".** It restores outputs and walks from the trigger, so a
  child that started mid-graph re-executes its whole prefix — every step before the section entry has no
  restored output. It does retry in place on the same row and the same `flowVersionId`, so attribution
  survives; `ON_LATEST_VERSION` starts a fresh row and forwards `parentRunId` and `failParentOnFailure`
  but not `parentWaitpointId`. Either way a child needs its entry step and seeded prior-step state
  persisted on its own row before any retry can reconstruct its input — free while
  `POST /v1/flow-runs/dispatch` is unbuilt, a migration after.

### `expectedChildren` exists only because child rows appear late

A dispatch is accepted the moment `POST /v1/webhooks/:flowId` queues the job; the child's `flow_run` row
appears two BullMQ hops later (metadata worker, after the trigger runs). So right after sealing, "no
non-terminal child of this barrier" is vacuously true — hence the count.

If a dispatch created the child row synchronously (QUEUED) before returning, the predicate collapses to
`sealed ∧ no non-terminal child`, and `expectedChildren`, `failedToDispatch` and `notStarted` all
disappear, along with the whole "accepted but never materialised" class.

**That comes free on the `PROCESS_IN_BATCHES` path.** `POST /v1/flow-runs/dispatch` is a new endpoint, so it can
insert the row synchronously at no cost to the existing hot webhook path; `expectedChildren` then survives
only for the CSV piece. Caveat: a pre-created QUEUED row that never runs relocates the hang rather than
removing it, unless the job's failure paths mark it terminal.

**On the `fan_in_child` join-table alternative** — considered and rejected for now. The mechanism that kills
`expectedChildren` is *synchronous child-row creation*, not the table, and that works just as well on
today's `flow_run.parentWaitpointId` column. Scored honestly, the table wins only on straggler
cancellation (a real child list to iterate) and on per-evaluation read cost (a small purpose-built table
beats one of the largest tables — though the partial covering index makes those reads index-only anyway).
It does **not** fix the O(N²) release evaluation (same asymptotics on either schema; the existence probe
is the fix) and it does not fix `expectedChildren`. Against that it adds a table and its indexes, adds a
join hop, and — if the join row duplicates child status — puts a write back inside the child's
transaction, which is exactly what decision 000015 removed. It is also **less hard-to-reverse than it
looks**: no barrier outlives `AP_PAUSED_FLOW_TIMEOUT_DAYS` and attribution is written once at dispatch, so
the table can be added later with a dual-write over one retention window and no backfill of live state.
Revisit it when `POST /v1/flow-runs/dispatch` is built.

### A fan-in timeout leaves stragglers running

The barrier releases with `stillRunning > 0` and nothing cancels those children. Each is bounded by
`FLOW_TIMEOUT_SECONDS`, except descendants paused on their own waitpoints, so the leak is bounded but
real. This is a **new capability, not a wiring job**: `getAllChildRuns` is recursive on `parentRunId` with
`CANCELLABLE_STATUSES = [PAUSED, QUEUED]`, so it cannot stop a RUNNING child. Doing it properly needs a
`parentWaitpointId`-scoped variant plus a decision about half-finished side effects. It belongs with the
entry point that can expose the choice to the user.

### Hard ceiling — state it, do not try to fix it in v1

Fan-out width is bounded by one sandboxed step's runtime (`FLOW_TIMEOUT_SECONDS`, 600s default, fixed on
Cloud). Less binding than it sounds: at `maxInFlight: 5` and ~10ms per dispatch, 600s is on the order of
300k batches, so for `PROCESS_IN_BATCHES` the real ceiling is the items array fitting in engine memory, not
dispatch throughput. Serial dispatch is what does not scale.

The earlier decision that rejected server-side dispatch for v1 as the wrong shape still stands — but it
also rejected fan-in itself on reasoning the barrier has since invalidated: the parent now *pauses* rather
than blocking inside the step, so the 600s bounds parse-and-dispatch only, not the wait. **Amend that
decision when the entry point lands.** (It is cited in the review as "000015", which is now this barrier's
number — the server-side-dispatch decision is not in this repo, so find it in Craftspace before citing a
number for it.)

### Slice refs a barrier's children read cannot expire inside the barrier window — except one gap

Three separate pieces compose into an invariant nothing states in one place: `clampFanInTimeout` caps every
barrier deadline at `AP_PAUSED_FLOW_TIMEOUT_DAYS`, the startup validator (`system-validator.ts`) refuses to
boot when that exceeds `AP_EXECUTION_DATA_RETENTION_DAYS`, and per-project retention overrides are floored
at the paused-flow timeout (`project-service.ts`). So a `FLOW_RUN_LOG_SLICE` written at seal time outlives
any barrier deadline. The gap: the slice clock starts at *write* and is never re-armed on resume (only the
run log file is — see [file-storage](../data-storage-observability/file-storage.md)), so a parent paused
between producing a large output and reaching the fan-out step erodes the margin. A child materializing an
expired ref fails cleanly: the engine download path maps 404/410 to `EngineFileNotFoundError`, a USER-type
step failure, never `INTERNAL_ERROR` (`engine-file-api.ts`).

### The fan-in summary cannot enumerate its own healthy children

The summary's `exceptions` array carries `childRunId` only for `failed` / `notStarted` / `failedToDispatch`
batches — succeeded and still-running children have no ids anywhere the parent's output can reach, by
design (per-batch entries for successes would scale the payload with N). Consequence for any parent-side
surface that browses children (run-detail panel, ops tooling): it needs a children-enumeration query —
child runs by `parentWaitpointId` plus the persisted dispatch index — and since list surfaces hide barrier
children by default (`parentWaitpointId IS NULL`), that query is an explicit include, not the default list.
A summary-only UI avoids the new surface but can never open a succeeded batch's logs.

The query itself is cheap and needs **no new index**: the partial index the barrier work already shipped
(`flow-run-entity.ts`, columns `['parentWaitpointId', 'projectId', 'status']`,
`WHERE "parentWaitpointId" IS NOT NULL`) covers it — a listing helper is a sibling of `countChildren`
selecting rows instead of a `GROUP BY`. Growing the summary to carry every child id is the wrong trade: it
reverses the payload bound (failure count, not N) *and* the summary lives in the parent's log file, so it
would grow that file with fan-out width.

Related web-side consequence: a parent-side panel cannot reuse the loop-iteration output lookup
(`extractStepOutput` → `executionJournal.getPathToStep`) for a fan-out container's body steps, because those
outputs are not in the parent's `run.steps` at all — they live in each child's own log file, fetched by
child run id. The loop *rail* presentation reuses fine; the data path underneath it does not.

### Past ~10k children the bottleneck stops being row reads

Every child's terminal transition enters the shared `runs_metadata_<runId>` distributed lock in the
runs-metadata worker, a critical path used by every run on the instance. Neither the partial index, the
existence probe, nor a join table touches this. The fix is to coalesce evaluation per barrier — a child
enqueues a deduplicated job keyed on the barrier id instead of evaluating inline (BullMQ deduplication is
already used in that worker). Only needed at or above the `AP_MAX_FAN_IN_CHILDREN` default of 10000.

### Gotchas

- **`wideEvent.set()` deep-merges into the object you passed it, so a test that captures those objects
  sees them mutate later.** Capturing `wideEvent.set` calls with `vi.spyOn` and pushing the raw `fields`
  into an array gives you references the logger keeps merging into: an earlier `{ fanIn: { barrierId } }`
  silently grows the later release's `releaseReason`/`stragglers`, and one release reads as two. `structuredClone`
  the fields at capture time. (The merge itself is what you want in production — one `fanIn` group per event.)
- **A pausing container executor must return early on `isCompleted`, or a *later* pause in the same run
  re-runs it.** A waitpoint resume re-executes the whole flow from the trigger and each executor decides for
  itself whether to skip; a step that already produced its output is skipped only because it checks. For
  `PROCESS_IN_BATCHES` the cost of forgetting is not a duplicated read — it is a second full fan-out, with a
  fresh barrier, every time anything downstream of the batch step pauses (an approval, a delay). Order matters:
  `isPaused` (resume with the released summary) → `isCompleted` (do nothing) → dispatch.
- **A crash-resumed dispatch loses the previous attempt's failed-to-dispatch *labels*, not its counts.**
  The batch step's paused output carries `failedToDispatchIndices` so the released summary can label an
  exception `failedToDispatch` rather than `notStarted`; a re-entry writes a fresh paused output holding only
  its own failures, because the indices are never persisted server-side (only the count is, on the barrier).
  So an index that failed to dispatch on attempt 1 and again on attempt 2 is labelled correctly, but one that
  failed on attempt 1 and was never retried reads as `notStarted`. Every count in the summary stays truthful —
  `failedToDispatch` comes from the barrier row. Persist the indices only if the label starts driving a UI
  affordance.
- **Seeded prior-step state goes through the same restore filter as a resume, which drops FAILED steps.**
  `isStepRestorable` keeps FAILED only for waitpoint resumes, so seeding a child through that path silently
  loses an upstream step that failed under continue-on-failure — the body's reference to it would resolve
  empty rather than carrying the parent's value. The seed is not a resume: the parent already chose what
  travels, so restore it whole (`keepFailedSteps`).
- **A rejected waitpoint call used to page oncall.** `waitpoint-client.ts` turned *every* non-ok response
  into `EngineGenericError`, which is `ExecutionErrorType.ENGINE` → job `INTERNAL_ERROR` → pager. Both
  server-side rejections a dispatcher can trigger are user-data conditions — a `dispatchDigest` mismatch and
  an `intendedChildren` over `AP_MAX_FAN_IN_CHILDREN` — so a 1M-item array would have paged someone. The
  client now maps 4xx to `WaitpointRejectedError` (`ExecutionErrorType.USER`, so a FAILED step carrying the
  server's message) and keeps `EngineGenericError` for 5xx. Any new engine→server client should split the
  same way rather than copying the old shape.
- **`assertDelayWithinTimeout` in `piece-executor.ts` can never fire.** It compares against
  `Number(process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS)`, and the sandbox env is built exhaustively in
  `create-sandbox-for-job.ts` — that var is not in it, so the value is `NaN` and `diffInDays > NaN` is
  always false. The guard has been dead since the sandbox env was locked down, and `PausedFlowTimeoutError`
  would say "more than NaN days" if it ever did fire. It is *not* what bounds a fan-in deadline — the
  server-side `clampFanInTimeout` is. Do not build on it without fixing it first.
- **Nothing reads `packages/web/src/assets/img/piece/*.svg`.** Every core step's `logoUrl` in
  `step-utils.tsx` points at `cdn.activepieces.com/pieces/new-core/`, so those repo files are provenance
  only and a new core step's icon is an upload, not a merge. The CDN objects are the bare glyph (`loop.svg`
  is 21×24, untiled); the 48×48 `rx="5"` tile formula applies to the repo copies.
