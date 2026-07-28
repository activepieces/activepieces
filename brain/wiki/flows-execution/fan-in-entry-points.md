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
- **`MAX_FAN_IN_CHILDREN` is 1000**, which a batched fan-out can exceed (1M rows at 100/batch = 10k
  batches). Decide whether to raise it or cap batches.
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
- **`ap-dispatch-key` becomes a caller-controlled BullMQ job id in a globally shared queue.**
  `webhook.service.ts` (`id: dispatchKey ?? webhookRequestId`) → `job-queue.ts` (`jobId: params.id`), and
  the default queue is `QueueName.WORKER_JOBS`, shared across platforms unless worker groups are enabled.
  Practical collision risk is near zero (keys carry an unguessable 21-char barrier id) but the shape is
  wrong; namespace it per project.
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

`parentWaitpointId` makes the real fix possible: **count this barrier's existing children and dispatch
only the remainder.**

- **Solvable for `BULK_PROCESS`** — an items array is indexable, so re-entry resumes at index *k* where
  *k* is the barrier's current child count.
- **Not solvable for streamed CSV** — a stream cannot cheaply seek to row *k*. State that as the finding
  rather than engineering around it.

Open: what `POST /v1/waitpoints` returns, so the dispatcher can tell "fresh" from "sealed, N expected"
from "partially dispatched, resume at k". (Re-entry into an already-sealed barrier no longer hard-fails
the run — the once-only seal made that a logged no-op.)

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
already used in that worker). Only needed if `MAX_FAN_IN_CHILDREN` is raised past 1000.
