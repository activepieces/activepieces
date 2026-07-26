---
icon: 🐌
---

# Gotcha: job dispatch is one serial loop per queue with a DB round-trip per job

Whole-fleet throughput can collapse while every worker is healthy and idle. Dispatch, not execution, is the cap.

`createQueueDispatcher` (`packages/server/api/src/app/workers/job-queue/queue-dispatcher.ts`) runs **one serial `runLoop` per queue name** — restored to single-dequeue by `a7e579df13` (2026-07-20), reverting #13998. Every iteration awaits `tryDequeue` before it can hand a job to the next waiter, and for `EXECUTE_POLLING` / `RENEW_WEBHOOK` that includes a **synchronous Postgres round-trip** in `zombiePollingInterceptor` → `triggerSourceRepo().findOneBy({ flowVersionId })`.

So a queue's dispatch rate is `1 / iteration_latency`, regardless of how many workers are polling. Sustaining ~55 polling jobs/sec needs sub-18ms iterations *including* that query. Nothing in the metrics says "dispatcher saturated" — you infer it.

### Diagnostic signature (how we found it, 2026-07-25/26)
Query ClickHouse `default.otel_logs` and check these together:
- **Worker fleet constant** — `uniqExact(LogAttributes['host'])` on `LogAttributes['event']='system.snapshot'`, grouped by `ResourceAttributes['service.version']`.
- **Per-job latency flat or improving** — `avg(JSONExtractInt(Body,'timings','executionMs'))` over `startsWith(Body,'{"event":"job.execute"')`. Workers are not the bottleneck.
- **App-side dequeues falling on the same curve as executions** — count `'[jobBroker#tryDequeue] Dequeued job'` on `ServiceName='activepieces-api'`. This is the tell that the loss is upstream of the workers.
- **The decisive one — uniform stretch:** for `EXECUTE_POLLING`, group by hour and compute `count() / uniqExact(JSONExtractString(Body,'flowVersion','id'))`. If `distinctTriggers` stays flat while fires-per-trigger decays (we saw 13,050 triggers hold steady while each went 15.2/hr → 1.05/hr over 30h), triggers are **not** dying — a shared dispatcher is throttling all of them equally. Triggers dying instead shows up as `distinctTriggers` dropping with fires-per-trigger held constant.

Also rule out diurnal before calling it an incident: compare the same hours against the previous week (`countIf(toDate(Timestamp)='<last week>')`). Our baseline was a flat ~270k executions/hr all day.

### Two latent hazards in the same file
1. **`await dequeue(...)` has no timeout.** If `worker.getNextJob()` hangs on Redis, `loopRunning` stays `true` forever, so every later `poll()` short-circuits `startLoop()`, parks for `WAITER_TIMEOUT_MS` (50s) and returns null. That queue is dead for the life of the process and does **not** self-heal — only a restart clears it.
2. **`tryDequeue` recurses** (deferred-failure, invalid-schema, DISCARD, and delay paths) once per skipped job. A burst of zombie repeat jobs drives unbounded async recursion in one dequeue.

Related: [[Workers]], [[Execution Runtime]].
