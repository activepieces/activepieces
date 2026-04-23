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
- **Waiter**: A rate-limited flow run sitting in Redis list `waiting_jobs_list:pool:{poolId}`, FIFO. Its BullMQ job is parked in `delayed` state with a safety-net delay.
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
                              │   2. LPOP waitlist → "C"            │
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
| `waiting_jobs_list:pool:{poolId}` | LIST | FIFO waiters pushed on the right, popped from the left |
| `concurrency-pool:limit:{poolId}` | string | Cached `maxConcurrentJobs` (24h TTL) |
| `project:concurrency-pool:{projectId}` | string | `poolId` or `"none"` sentinel (24h TTL) |

**Postgres (EE)**: `concurrency_pool` table — `id`, `platformId`, `key`, `maxConcurrentJobs`. Unique on `(platformId, key)`. Projects join via `project.poolId`.

## Lua Scripts

**`acquireSlotOrEnqueue`** — single atomic operation:
1. `ZREMRANGEBYSCORE` sweeps entries older than `FLOW_TIMEOUT + 60s` (crash recovery)
2. If member already present → return `"acquired"` (idempotent re-dispatch)
3. If `ZCARD < maxJobs` → `ZADD` to active set, return `"acquired"`
4. Else → `RPUSH` to waitlist, return `"queued"`

**`releaseSlotAndPopWaiter`** — single atomic operation:
1. `ZREM` member from active set
2. `LPOP` waitlist
3. If a waiter was popped → `ZADD` it to active set (reserves slot), return its member id
4. Else → return empty string

**`rollbackPromotion`** — used if BullMQ's `job.promote()` fails:
1. `ZREM` the popped member from active set
2. `LPUSH` it back to the head of the waitlist

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
