---
icon: 🐌
---

# Gotcha: polling starves first when the fleet loses capacity

`EXECUTE_POLLING` and `RENEW_WEBHOOK` are `veryLow` = **priority 5**
(`packages/core/execution/src/lib/workers/job-data.ts:51`). Webhooks and async flows are 3, sync
flows and chat agents 2, user-interaction jobs 1. BullMQ pops the lowest score first, so when worker
capacity drops, **schedule/polling triggers are the first thing to go silent** — everything else still
looks fine because it preempts them.

That makes "my `*/1` schedule flow isn't triggering" the *earliest* symptom of a partial fleet wedge,
long before anyone calls it an outage.

**Seen 2026-07-27.** 484 worker containers up, `active:103` (healthy baseline ~408 — see
[[gotcha-workers-wedge-silently-and-report-healthy]], still on `0.86.3`, fix not deployed). The
priority-5 lane held **13,190** jobs; 5,318 of them 15–30 min overdue, 54 over an hour. A single
customer flow's poll job moved rank 8803 → 7319 in 8 minutes: **~20–75 min per poll** on a
one-minute cron. The surviving ~100 slots were ~95% `EXECUTE_WEBHOOK`.

## Diagnosing it

Bucket the prioritized zset by priority — BullMQ scores are `priority * 2^32 + counter`, so
`ZCOUNT bull:workerJobs:prioritized <p>*2^32 <p+1>*2^32-1` gives the depth of each lane:

```
prio 3:      12      webhooks — consumed on arrival, never backs up
prio 5:  13,092      EXECUTE_POLLING — the real lag
prio 6: 115,902      rate-limited EXECUTE_FLOW — parked, not blocking
```

A huge `prioritized` total is **not** by itself the signal; check which lane. Then take a repeat
job's rank twice a few minutes apart (`ZRANK`) — the drift rate is the lane's true drain rate, and it
is far lower than the queue's overall completion rate because higher priorities keep cutting in.

For a repeat job, lateness comes from the **scheduled millis in its id suffix**
(`repeat:<flowVersionId>:<millis>`), not the `timestamp` hash field — `timestamp` is when the
scheduler produced the job, which for a daily cron is 24h before it is due.

## Two things that look like bugs and aren't

- **Republishing does not help.** It correctly removes the old scheduler and arms a new one keyed by
  the new `flowVersionId` (`job-queue.ts` `upsertJobScheduler(data.flowVersionId, …)`), but the new
  job joins the back of the same starved lane.
- **Removing a scheduler does not remove its already-enqueued job.** `removeJobScheduler` leaves the
  outstanding `repeat:<oldVersionId>:<millis>` in `prioritized`, so it fires once against a
  soft-deleted `trigger_source`.

## The priority-6 sludge

`RATE_LIMIT_PRIORITY` is `lowest` = 6. Rate-limited `EXECUTE_FLOW` jobs re-enter at that priority and
sit **behind** the polling lane — so while polling is chronically backed up, they never drain. The
2026-07-27 pile held jobs going back to **2026-07-08** (19 days), ~52% from one project. Anything
demoted to priority 6 on a queue with a standing priority-5 backlog is effectively dropped, silently.

Related: [[gotcha-workers-wedge-silently-and-report-healthy]] — the capacity loss that triggers this.
