---
icon: 🐌
---

# Gotcha: job dispatch is one serial loop per queue with a DB round-trip per job

Whole-fleet throughput can collapse while every worker is healthy and idle. Dispatch, not execution, is the cap.

`createQueueDispatcher` (`packages/server/api/src/app/workers/job-queue/queue-dispatcher.ts`) runs **one serial `runLoop` per queue name**. Every iteration awaits `tryDequeue` before it can hand a job to the next waiter, and for `EXECUTE_POLLING` / `RENEW_WEBHOOK` that includes a **synchronous Postgres round-trip** in `zombiePollingInterceptor` → `triggerSourceRepo().findOneBy({ flowVersionId })`.

So a queue's dispatch rate is `1 / iteration_latency`, regardless of how many workers are polling. Sustaining ~55 polling jobs/sec needs sub-18ms iterations *including* that query. Nothing in the metrics says "dispatcher saturated" — you infer it.

### Why it is serial (don't "just" parallelize it)
`getNextJob` moves a job `wait → active` at the moment of dequeue — the app owns it before the worker has started it, and it only leaves `active` on completion or the slow stalled-scan (minutes). #11792 (2026-03-16) added the waiter queue so a job is **never pulled out of Redis unless a worker is already parked waiting for it**. Before that, `poll()` called `tryDequeue` directly and every worker dequeued independently; jobs got pulled for workers that had already timed out or disconnected and `active` ran away past total worker concurrency. That prod incident is pinned by `test/unit/app/workers/job-queue/active-invariant.test.ts`.

**The two invariants are in tension:** serial dispatch protects `active`, but caps fleet throughput. #13962 (2026-06-28) added a second, independent guard for the same invariant — `jobAssignmentTracker` + `releaseConnectionJobs` returns a dead socket's jobs — so the serialization is arguably now redundant. #13998 (2026-07-01) removed the waiter queue and made polls dequeue concurrently again; it was reverted by #14316 (2026-07-20) with no recorded reason. Note the concurrent version dropped the `onOrphanedJob` path, so a poll whose socket dies mid-`dequeue` strands the job in `active` — likely the revert's motive. Any future fix has to satisfy both invariants at once.

### Diagnostic signature (how we found it, 2026-07-25/26)
Query ClickHouse `default.otel_logs` and check these together:
- **Worker fleet constant** — `uniqExact(LogAttributes['host'])` on `LogAttributes['event']='system.snapshot'`, grouped by `ResourceAttributes['service.version']`.
- **Per-job latency flat or improving** — `avg(JSONExtractInt(Body,'timings','executionMs'))` over `startsWith(Body,'{"event":"job.execute"')`. Workers are not the bottleneck.
- **App-side dequeues falling on the same curve as executions** — count `'[jobBroker#tryDequeue] Dequeued job'` on `ServiceName='activepieces-api'`. The tell that the loss is upstream of the workers.
- **The decisive one — uniform stretch:** for `EXECUTE_POLLING`, group by hour and compute `count() / uniqExact(JSONExtractString(Body,'flowVersion','id'))`. If `distinctTriggers` stays flat while fires-per-trigger decays (we saw 13,050 triggers hold steady while each went 15.2/hr → 1.05/hr over 30h), triggers are **not** dying — a shared dispatcher is throttling all of them equally. Triggers dying instead shows up as `distinctTriggers` dropping with fires-per-trigger held constant.

Rule out diurnal before calling it an incident: compare the same hours against the previous week. Our baseline was a flat ~270k executions/hr all day.

### Latent hazards in the same file
1. **`await dequeue(...)` has no timeout.** If `worker.getNextJob()` hangs on Redis, `loopRunning` stays `true` forever, so every later `poll()` short-circuits `startLoop()`, parks for `WAITER_TIMEOUT_MS` (50s) and returns null. That queue is dead for the life of the process and does **not** self-heal — only a restart clears it.
2. **`tryDequeue` recurses** (deferred-failure, invalid-schema, DISCARD, and delay paths) once per skipped job, so discarded zombie repeats burn dispatcher budget without producing an execution (we saw 520k dequeues vs 270k executions). A burst drives unbounded async recursion in one dequeue.
3. **`concurrency: 500` on the BullMQWorker is inert** — `autorun: false` means BullMQ's internal run loop never starts, so that setting never applies. Reads as 500-way parallel dispatch; it is 1-way.

Related: [[Workers]], [[Execution Runtime]].
