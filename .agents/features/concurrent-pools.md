# Concurrent Pools Module

## Summary
Concurrent Pools caps how many flow runs can execute in parallel for a given platform, project, or shared group. When the limit is hit, new runs wait in a Redis FIFO waitlist instead of spinning on retries. The moment a running job finishes, the next waiter is woken up immediately via BullMQ's `job.promote()`. Enforcement is atomic (Redis Lua), race-free, and event-driven — no periodic polling loop.

## Key Files
- `packages/server/api/src/app/workers/job-queue/interceptors/rate-limiter-interceptor.ts` — BullMQ interceptor that calls acquire/release on every `EXECUTE_FLOW` dequeue and finish
- `packages/server/api/src/app/workers/job-queue/interceptors/concurrency-pool-redis.ts` — pure Redis primitives: three Lua scripts for acquire-or-enqueue, release-and-pop, and rollback
- `packages/server/api/src/app/workers/job-queue/job-queue.ts` — `jobQueue(log).promoteJob({ jobId, platformId })` wraps BullMQ's `Job.promote()`
- `packages/server/api/src/app/ee/platform/concurrency-pool/concurrency-pool.entity.ts` — `concurrency_pool` table (EE)
- `packages/server/api/src/app/ee/platform/concurrency-pool/concurrency-pool.service.ts` — pool CRUD, project↔pool mapping, cached limit lookup
- `packages/server/api/src/app/database/redis/keys.ts` — `getConcurrencyPoolSetKey`, `getConcurrencyPoolWaitlistKey`, `getConcurrencyPoolLimitKey`, `getProjectConcurrencyPoolKey`
- `packages/server/api/test/unit/app/workers/job-queue/interceptors/concurrency-pool-redis.test.ts` — Lua + race tests
- `packages/server/api/test/unit/app/workers/job-queue/interceptors/rate-limiter-interceptor.test.ts` — interceptor + promote tests

## Edition Availability
- **Community (CE)**: Built-in rate limiter always on when `PROJECT_RATE_LIMITER_ENABLED=true`. Every project gets its own implicit pool, keyed by `projectId`. Limit comes from `DEFAULT_CONCURRENT_JOBS_LIMIT` env var.
- **Enterprise (EE) / Cloud**: Same primitives, plus the `concurrency_pool` table so multiple projects can share a single named pool. Limit resolution order: `project.poolId → pool.maxConcurrentJobs → platform plan → default env var`. Cloud plan-based limits: STANDARD=5, APPSUMO tiers 5–25, ENTERPRISE=30.

## Domain Terms
- **Pool**: A named bucket of N concurrent slots. Can span multiple projects (EE) or default to a single project (CE).
- **Slot**: One executing flow run. Represented as a member in a Redis sorted set `active_jobs_set:pool:{poolId}`, score = acquisition timestamp.
- **Waiter**: A rate-limited flow run sitting in Redis sorted set `waiting_jobs_zset:pool:{poolId}`, ordered by an insertion counter (FIFO). Its BullMQ job is parked in `delayed` state with a safety-net delay.
- **Member**: `{projectId}:{jobId}` string used as the identifier in both the active set and the waitlist.
- **Effective pool id**: `project.poolId ?? projectId` — when a project is not attached to a shared pool, its own id plays the role of a solo pool.
- **Safety-net delay**: The BullMQ delay applied to a rate-limited job. Set to `FLOW_TIMEOUT_SECONDS + 120s`. If the normal promote-on-release path fails, this timer eventually re-dispatches the job. Acts as a last-resort backstop only.

## How It Works (diagram)

Imagine a pool with **limit = 2**. Three runs arrive. One finishes:

```
                              ┌─────────────────────────────────────┐
                              │   Redis (per pool, atomic Lua)      │
                              │                                     │
  Flow Run A  ──► acquire ──► │ active set  [A, B]  (limit=2)       │
  Flow Run B  ──► acquire ──► │ waitlist    [     ]                 │
  Flow Run C  ──► acquire ──► │ active set  [A, B]  ← full!         │
                              │ waitlist    [C]     ← pushed here   │
                              │                                     │
                              │  (Run C → BullMQ delayed state,     │
                              │   safety-net delay only)            │
                              └─────────────────────────────────────┘

          A finishes
              │
              ▼
                              ┌─────────────────────────────────────┐
                              │   atomic Lua: release-and-pop       │
                              │                                     │
                              │   1. remove A from active set       │
                              │   2. ZPOPMIN waitlist → "C"         │
                              │   3. ZADD C into active set         │
                              │   4. return "C" to JS               │
                              └─────────────────────────────────────┘
              │
              ▼
                              ┌─────────────────────────────────────┐
                              │ jobQueue.promoteJob({ jobId: C })   │
                              │   → BullMQ Job.promote()            │
                              │   → run C jumps from delayed to     │
                              │     waiting, worker picks it up     │
                              └─────────────────────────────────────┘
```

**The key trick**: both the acquire-or-push and the release-and-pop run inside a single Lua script, so the check and the mutation happen as one atomic Redis operation. Two workers racing to finish at the same moment cannot pop the same waiter. Two runs racing to acquire cannot both exceed the limit.

**No periodic polling**: run C is woken by the release event itself, not by a retry timer.

## Data Model

**Redis keys (runtime)**:
| Key | Type | Contents |
|-----|------|----------|
| `active_jobs_set:pool:{poolId}` | ZSET | Currently running members, score = timestamp (used to sweep stale entries on the next acquire) |
| `waiting_jobs_zset:pool:{poolId}` | ZSET | FIFO waiters; score = monotonically increasing insertion timestamp/counter |
| `concurrency-pool:limit:{poolId}` | string | Cached `maxConcurrentJobs` (24h TTL) |
| `project:concurrency-pool:{projectId}` | string | `poolId` or `"none"` sentinel (24h TTL) |

**Postgres (EE)**: `concurrency_pool` table — `id`, `platformId`, `key`, `maxConcurrentJobs`. Unique on `(platformId, key)`. Projects join via `project.poolId`.

## Lua Scripts

**`acquireSlotOrEnqueue`** — single atomic operation, returns `{outcome, promoted[]}`:
1. `ZREMRANGEBYSCORE` sweeps entries older than `FLOW_TIMEOUT + 60s` (crash recovery)
2. If member already present in active set → return `{acquired, []}` (idempotent re-dispatch)
3. If member already present in waitlist (`ZSCORE`) → return `{queued, []}` (prevents safety-net re-dispatch from creating duplicate waitlist entries)
4. **Promote loop**: while `ZCARD active < maxJobs`, `ZPOPMIN` head of waitlist into active. This self-heals wedged pools (active empty, waiters parked) on the next acquire — no separate cron needed.
5. If `ZCARD active < maxJobs` after promotion → `ZADD` arrival to active, return `{acquired, [promoted...]}`.
6. Else → `ZADD` arrival to waitlist (score = max(now, lastScore+1)), return `{queued, [promoted...]}`.

The caller is responsible for invoking `jobQueue.promoteJob` on each member in `promoted[]` to wake their parked BullMQ jobs.

**`releaseSlotAndPopWaiter`** — single atomic operation:
1. `ZREM` member from active set
2. `ZPOPMIN` head of waitlist
3. If a waiter was popped → `ZADD` it to active set (reserves slot), return its member id
4. Else → return empty string

**`dropPromotedWaiter`** — used when the popped waiter cannot be promoted (job not found / not in delayed state). Unparseable members are filtered and dropped silently inside the pool itself, so callers only ever see well-formed `{projectId, jobId}` waiters:
1. `ZREM` the popped member from active set (frees the reserved slot)
2. The member is **not** re-pushed to the waitlist — the BullMQ safety-net delay re-enqueues it via `preDispatch` if the job is still alive. This avoids a stale waiter at the head of the queue blocking all subsequent waiters until the waitlist TTL expires.

## Limit Resolution Order

When a job arrives at the interceptor, the max-concurrent limit is resolved in this order:
1. `concurrencyPoolService.getProjectPoolId(projectId)` → if mapped to a pool, use `concurrencyPoolService.getPoolLimit(poolId)`
2. Otherwise, on Cloud edition, look up the platform's plan (`platform_plan:plan:{platformId}`) and use the plan's limit from `PLAN_CONCURRENT_JOBS_LIMITS`
3. Otherwise fall back to `AP_DEFAULT_CONCURRENT_JOBS_LIMIT`

The effective pool id — the key for all Redis operations — is `project.poolId ?? projectId`. Every project always has a pool, either named (EE) or implicit (CE).

## Skip Conditions (when the interceptor is a no-op)

- `AP_PROJECT_RATE_LIMITER_ENABLED=false`
- Job type is not `WorkerJobType.EXECUTE_FLOW` (webhooks, polling triggers, user-interaction jobs bypass)
- `environment === RunEnvironment.TESTING` (test runs from the builder are not rate-limited)

## Crash Recovery

- A worker process that crashes mid-run leaves its member in the active set. The next `ZREMRANGEBYSCORE` on acquire will sweep it once the score ages past `FLOW_TIMEOUT_SECONDS + 60s`.
- If `onJobFinished` is never called for some reason, the BullMQ safety-net delay (`FLOW_TIMEOUT_SECONDS + 120s`) eventually re-dispatches the waiter anyway. The promote-on-release path is the fast happy path, not a correctness requirement.

## Side Effects

- `preDispatch` → Redis sorted-set update (and optional waitlist push)
- `onJobFinished` → Redis sorted-set delete, optional waitlist pop, optional `BullMQ.Job.promote()` on a different job

## Why This Design

| Alternative | Why not |
|-------------|---------|
| Exponential backoff retries (`20s → 40s → …`) — the previous design | Each retry is a periodic check; a newly-freed slot sits idle until the next retry timer fires |
| Postgres `FOR UPDATE SKIP LOCKED` (windmill-style) | Activepieces' queue is BullMQ/Redis; switching backends is a major rewrite |
| BullMQ Pro's concurrency groups | Paid feature; the Lua-based approach is free and atomic |
| Per-task queues (trigger.dev-style) | Would require many BullMQ queues; operationally expensive for multi-tenant Cloud |
| n8n's `QUEUE_WORKER_CONCURRENCY` | Global worker-level cap, not per-tenant; does not solve multi-tenant fairness |
