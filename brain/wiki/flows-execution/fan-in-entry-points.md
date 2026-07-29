---
icon: 🪃
---

# Fan-in entry points

The [fan-in barrier](./flow-runs.md) ships **dormant** — the server-side join is complete and no piece
calls it. This page is what the first caller has to deal with. Read decision 000015 first for why the
barrier is shaped the way it is; everything here is downstream of that.

**Binding constraint, settled: if it fans out, it must fan in.** No fire-and-forget fan-out action,
ever. `callFlow.waitForResponse` (a single fire-and-forget call, not a fan-out) stays as it is.

### The two candidates

**A. Stream CSV to Subflows.** Exists on `origin/feat/stream-csv-to-subflows` as a **fire-and-forget**
action (`packages/pieces/core/subflows/src/lib/actions/stream-csv-to-flow.ts` plus a bounded-window
dispatcher in `lib/fan-out.ts`, `maxInFlight: 5`). It must be converted to fan in before it ships.
Children go through `POST /v1/webhooks/:flowId` to a *separate* flow carrying a Callable Flow trigger.

**B. Bulk Process step.** A new **`FlowActionType.BULK_PROCESS`** core action — a loop-shaped container
whose nested body is a *section* of steps, batched out to child runs.

- **Not** a `LOOP_ON_ITEMS` mode. Costs `LATEST_FLOW_SCHEMA_VERSION` 22→23 and a case in the ~45 files
  that branch on `LOOP_ON_ITEMS`; buys honest semantics — a loop's output is per-iteration results, a
  batched fan-out's is a fan-in summary, and conflating them is a silent output-shape change.
- Children run the **parent's** `flowVersionId` starting at a section entry step. `flowExecutor.execute()`
  already starts from any action node (`packages/server/engine/src/lib/handler/flow-executor.ts`), and
  `stepNameToTest` is existing precedent for executing a subset of a version. No hidden flow rows, no
  publish-time sync problem, no orphans when the section is deleted. The body terminates itself
  (`nextAction` is null at the end of the nested chain), so no exit marker is needed.
- **Section inputs**: statically extract the body's `{{ stepX.* }}` references at dispatch and resolve
  them from the parent's live state, so only what is referenced travels. No such utility exists yet;
  `flowStructureUtil.transferStep` already visits every string value and is the hook for it.
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
  to `BULK_PROCESS`** — a core executor ships with the engine, so there is no piece-registry skew.
- **Bounded dispatch concurrency** — reuse `fan-out.ts` (`maxInFlight: 5`) from the CSV branch.
- **The child cap is `AP_MAX_FAN_IN_CHILDREN`, default 10000** (was a hardcoded 1000 in the zod schema;
  now an app system prop enforced in `waitpointService.sealFanInBarrier` against
  `expectedChildren + failedToDispatch`). A 1M-row batched fan-out at 100/batch still lands exactly on
  the default, so a self-hoster running wider has to raise it — and past ~10k the runs-metadata lock
  becomes the real bottleneck (see below).
- **Operability.** Nothing can answer "how many barriers are open right now", "how many released on
  timeout this week", or "which have stragglers". For a primitive whose failure mode is a multi-day
  silent hang, that is the gap to close before an entry point ships:
  `wideEvent.set({ fanIn: { barrierId, expectedChildren, releaseReason, stragglers, latencyMs } })` at
  each release site costs almost nothing and makes it queryable in ClickHouse.
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
- **Create and seal are one endpoint discriminated by the absence of a field.** In `waitpoint-service.ts`,
  `isFanIn` plus a nil `expectedChildren` means create and a present one means seal. A caller that
  sensibly tries create+seal in one call gets "The fan-in barrier for this step no longer exists" — an
  error describing the opposite of what happened. `sealFanInBarrier` also re-finds the barrier by
  `(flowRunId, stepName)` when the engine already holds its id. Resolve as `POST /v1/waitpoints/:id/seal`
  **while nothing depends on the current shape**; after an entry point ships this is a breaking API
  change. Same open question as "what does `POST /v1/waitpoints` return" below.

### The dispatch loop is not resumable

If the dispatching step dies mid-loop (sandbox timeout, killed worker, flow timeout) you get orphaned
children plus either an unsealed barrier or a failed run. The dispatch key
(`ap-dispatch-key: <barrierId>-<index>` → BullMQ jobId) only dedupes while a child job is still queued or
active; once it completes a replay would create duplicates, so `createFanInBarrier` throws instead.

`parentWaitpointId` makes the real fix possible: **skip the indices this barrier already dispatched and
send only the rest.** Two clauses have to hold, and neither of them separates CSV from `BULK_PROCESS`.

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

**2. The source must be stable bytes.** Batching is *deterministic* — `fanOutBatches` derives
`batchIndex` from position alone and `createCsvParser` is pure given the same `delimiter`, so the same
bytes and the same `batchSize` always yield the same batch *k*. Re-entry therefore never seeks: it
re-parses from row 0 and discards the first *k* batches undispatched, at ~µs/row against ~2ms/batch of
dispatch. **A stream being unseekable is not the blocker** — the earlier finding here had the wrong
reason. What does break is an unstable *source*: `Property.File({ streaming: true })` also accepts a URL,
and a pre-signed link expires, `latest.csv` changes, an export endpoint regenerates in another row order.
Uploads and previous-step files are stored bytes and resume exactly as well as an items array, so the
CSV caveat shrinks to rejecting (or warning on) non-stored sources.

Open: what `POST /v1/waitpoints` returns, so the dispatcher can tell "fresh" from "sealed, N expected"
from "partially dispatched, these indices already went". (Re-entry into an already-sealed barrier no
longer hard-fails the run — the once-only seal made that a logged no-op.)

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

**That comes free on the `BULK_PROCESS` path.** `POST /v1/flow-runs/dispatch` is a new endpoint, so it can
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
300k batches, so for `BULK_PROCESS` the real ceiling is the items array fitting in engine memory, not
dispatch throughput. Serial dispatch is what does not scale.

The earlier decision that rejected server-side dispatch for v1 as the wrong shape still stands — but it
also rejected fan-in itself on reasoning the barrier has since invalidated: the parent now *pauses* rather
than blocking inside the step, so the 600s bounds parse-and-dispatch only, not the wait. **Amend that
decision when the entry point lands.** (It is cited in the review as "000015", which is now this barrier's
number — the server-side-dispatch decision is not in this repo, so find it in Craftspace before citing a
number for it.)

### Past ~10k children the bottleneck stops being row reads

Every child's terminal transition enters the shared `runs_metadata_<runId>` distributed lock in the
runs-metadata worker, a critical path used by every run on the instance. Neither the partial index, the
existence probe, nor a join table touches this. The fix is to coalesce evaluation per barrier — a child
enqueues a deduplicated job keyed on the barrier id instead of evaluating inline (BullMQ deduplication is
already used in that worker). Only needed at or above the `AP_MAX_FAN_IN_CHILDREN` default of 10000.
