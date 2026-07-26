---
icon: 🧟
---

# Gotcha: retrying the failed-job backlog resurrects unfixable zombies

Before you read anything into a "top failure reasons" tally of `workerJobs`, **check how old the underlying runs are**. A bulk retry of the failed set re-runs jobs whose payload / log files expired months ago. Those can never succeed, so they immediately re-fail, land back in the failed set, and dominate the categorizer's counts with a failure mode nobody can act on.

The BullMQ job carries no useful timestamp for this — `processedOn` / `finishedOn` come back empty on these. Get the age from the Postgres `flow_run` row instead: `created` is the real run date, `updated` is when it was last retried. A cluster of wildly different `created` values sharing one near-identical `updated` timestamp *is* the bulk-retry signature.

**Seen July 2026:** 59 failed jobs categorized as if they were current. 35 of them (59%) were zombies — `created` spanning 2025-10-28 to 2026-03-31, all `updated` within the same two minutes that morning. Every one was a RESUME whose payload/log file was long gone, i.e. the exact class already fixed by #14211 (404/410 → USER-typed `EngineFileNotFoundError` → clean FAILED run). Their stack traces still referenced `packages/shared/src/lib/core/common/try-catch.ts`, a path that no longer exists — a cheap tell that a job predates a refactor. Only ~23 jobs were genuinely live.

**Practical rules**
- Cross-check `created` before believing any category count; report live vs. stale separately.
- **`attemptsMade > 2` proves a manual retry.** The queue's `defaultJobOptions` is `attempts: 2` (exponential backoff, 8 min) — see `job-queue.ts`. So auto-retry can never exceed 2, and the 9–12 counts on these were hand-retried. Corollary: a genuine one-off failure costs *one* wasted re-execution, not a retry storm — don't over-rate the severity of a single failed job.
- A stack-trace path that doesn't exist in `main` dates the job better than anything in Redis.
- Drain the stale ones rather than "fixing" them; the fix already shipped.
