---
status: accepted
---

# Batch children are dispatched by an app queue job, not by the engine

## Decision
A batch step makes one call, `POST /v1/waitpoints` with the barrier and its `fanOut` source, and pauses. The
server stores the source in `distributedStore` under `barrier_source:<barrierId>` and adds a `fan-out-dispatch`
job, carrying only the barrier id, to the barrier queue. The job runs in the app process and creates the children.

The job works in chunks. One transaction per chunk locks the barrier `FOR SHARE` while it is `PENDING`, takes the
next unclaimed signals `FOR UPDATE SKIP LOCKED`, claims them (`refId` = the new child run id, guarded by
`refId IS NULL AND status = 'PENDING'`) and inserts their `flow_run` rows. Each child is then enqueued in a short
transaction that holds the barrier `FOR SHARE` while it is still `PENDING`, with its run id as its job id. A child
whose barrier closed in between is cancelled instead.

When dispatch gives up for good, the handler deletes the source key and then marks the **unclaimed** signals
`NOT_DISPATCHED`. Claimed signals keep their live children, and the barrier releases when those report.

## Context
The loop was first planned inside the parent's engine sandbox, which is killed at `FLOW_TIMEOUT_SECONDS`. A killed
loop has to work out what its previous attempt already sent, which needs a source digest, a complement of the
dispatched indices and a unique `(parentWaitpointId, dispatchIndex)` index. A queue job is redelivered rather than
killed, and it re-reads stored bytes instead of re-resolving the items.

## Why
- **The resume point is a claim, not a gap query.** Two dispatchers over one barrier do happen: the barrier worker
  runs on BullMQ defaults (`stalledInterval` 30 s, `maxStalledCount` 1), so a job that holds the event loop past
  30 s is redelivered while the first copy still runs. The claim gives each signal at most one child.
- **Release and cancel wait for dispatch.** `closeBarrier` locks the barrier `FOR UPDATE`, and a cancel deletes
  it. Both wait for an open claim or enqueue, so nothing is claimed or enqueued after a release, and a cancel's
  child snapshot sees every child.
- **The step makes an ordinary HTTP call**, so there is no piece-framework version floor to forget.
- **The source is out of band** for the same reason `runs_metadata:<runId>` is: a multi-MB array in BullMQ job
  data is a large payload on a hot Redis queue.
- Rejected: keep the loop in the engine. It is bounded by the sandbox timeout and needs the resumable-complement
  machinery above.

## Consequences
- **The dispatcher holds a barrier-queue slot for the dispatch window**, about a minute at the 10 000-signal cap.
- **Nothing bounds the dispatch window except the barrier deadline**, because the parent pauses before its
  children exist.
- **Giving up is slow.** Five attempts with a `2^(n-1) x 8 min` backoff put about two hours before the give-up
  handler runs.
- **The batch size is clamped** so the signal count fits the platform cap
  (`platformConfigurationService.maxBarrierSignals`), and the clamped size is returned as `batchSize`.
- **A child claimed just before a release never starts.** It is cancelled at its enqueue, but the release summary
  still counts it as `stillRunning` with its run id, because its claim came first.
