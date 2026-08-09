---
status: accepted
---

# Batch children dispatch through a dedicated endpoint that creates the child row synchronously

## Decision
`PROCESS_IN_BATCHES` dispatches its children through **one new engine-only endpoint**,
`POST /v1/flow-runs/dispatch`, and that endpoint **inserts the child's `flow_run` row inside the request,
before it returns** — then queues the job, and deletes the row it just inserted if queueing throws.

The request is `{ parentRunId, entryStepName, seedSteps, parentWaitpointId?, dispatchIndex, dispatchKey }`.
Project scope comes from the engine principal, never the body: the flow, flow version and environment are
all read off the parent run row. The insert is idempotent per `(parentWaitpointId, dispatchIndex)` —
`ON CONFLICT DO NOTHING` against the unique partial index `idx_run_parent_waitpoint_dispatch_index`, then
read the row back by barrier and index, so a re-dispatched index returns the existing child id and queues
nothing. Barrier attribution is validated here and **dropped** rather than fatal if it does not resolve in
the project; the response carries `attributedToBarrier` so the dispatcher can treat a dropped attribution as
a dispatch failure. The queue job id is namespaced `` `${projectId}-${dispatchKey}` `` (separator `-`,
because a custom BullMQ job id rejects `:`).

## Context
Batch children cannot ride `POST /v1/webhooks/:flowId`, the transport every other subflow call uses: that
route resolves the **published** flow version and runs a trigger, while a batch child must run the
**parent's** version starting mid-graph at the body's entry step. So some new transport was required
regardless — the only open question was its shape.

On the webhook path a dispatch is "accepted" the moment the job is queued and the child's row appears two
BullMQ hops later, after the trigger runs. That lateness is the sole reason the fan-in barrier carries
`expectedChildren`, `failedToDispatch` and `notStarted` at all: right after sealing, "no non-terminal child
of this barrier" is vacuously true, so the predicate needs a count to compare against. The same lateness
makes a child count useless as a resume watermark, and made a whole class of failure possible — accepted,
never materialised, invisible to everything.

The alternatives were a server-side fan-out job (materialise the item list to storage, add a job type), and
reusing the webhook path with a mid-graph mode bolted on.

## Why
A new endpoint could do synchronously what the hot webhook path cannot afford to. Creating the row inside
the request collapses most of the accepted-but-never-materialised class: the row either exists when the call
returns or the call failed, with no window in between. It is what lets the dispatch index be **persisted on
the child row**, which is what makes the dispatch loop resumable — the resume point comes from the set of
dispatched indices, never a count, so a crash with batches 900–904 in flight cannot silently drop 900, 901
and 904 the way a count-based watermark would. It is also what makes the parent-side batch browser a plain
indexed read rather than a new join table.

Reusing the webhook path was rejected because published-version resolution and trigger execution are the
route's whole job; a mid-graph mode would be a second endpoint wearing the first one's URL, on the hottest
path in the system. The server-side fan-out job was rejected on cost: it materialises the whole item list to
storage and adds a job type to solve a problem an endpoint solves without either.

## Consequences
- **The hang is relocated, not removed.** A pre-created QUEUED row whose job never runs waits out
  `AP_PAUSED_FLOW_TIMEOUT_DAYS` instead of never existing. The dispatch-time half is covered — a throw from
  `addToQueue` deletes the row — but a row whose job is queued and then lost is not. Any future failure path
  that can lose a queued job must mark the row terminal.
- **`expectedChildren` survives anyway.** The predicate *could* collapse to `sealed ∧ no non-terminal child`
  on this path, but the CSV piece still dispatches through the webhook, and one predicate serving both paths
  beats two. The collapse is available, unspent.
- **A 201 is not proof the child joined the barrier.** Attribution is dropped, not fatal, so a dispatcher
  that ignores `attributedToBarrier` counts an orphan toward `expectedChildren` that `countChildren` can
  never see, and the parent waits out the paused-flow timeout.
- **This is the piece that would have to be undone** to move batch children onto any other transport —
  the synchronous row, the persisted dispatch index and the unique partial index are what resumability,
  idempotent re-dispatch and the batch browser are all built on.
- One migration, `AddUniqueDispatchIndexPerFanInBarrier1822000000000` — additive, `CONCURRENTLY`,
  `breaking = false`.
