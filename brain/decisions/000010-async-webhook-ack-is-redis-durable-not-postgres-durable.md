---
status: accepted
---

# Async webhook ACK is Redis-durable, not Postgres-durable

## Decision
The async webhook endpoint returns 200 (with `x-webhook-id`) as soon as the job is enqueued to Redis, with no Postgres row existing until a worker picks it up. Durability is tuned by Redis persistence (AOF `everysec`, so a window of up to 1s), not a durable-ACK write.

## Context
Async exists to avoid putting a run/intent row per webhook on the ingest hot path before returning 200.

## Why
Keeping the ACK Redis-only holds ingest at Redis latency. Rejected a Postgres write before ACK: every webhook would pay a write, ingest throughput would be bounded by Postgres, and webhook acceptance would drop whenever Postgres does. The cost is accepted and tuned by the operator's `redis.conf`, documented in `docs/install/guarantees/disaster-recovery.mdx`.

## Consequences
A Redis dataset loss silently drops acknowledged-but-unstarted webhooks inside the persistence window.

- Queue-migration refills rebuild schedules, renewals, and paused-run timers against a fresh Redis.
- The `x-webhook-id` is not a durable receipt; it's traceable only once a worker starts the run.
- Don't back up Redis; persist it.

## Correction (2026-07-28)
Two claims above were wrong when written, and the second one undercuts the rationale:

1. **"Sync webhooks write a Postgres row before ACK"** — false for `PRODUCTION`. `queueOrCreateInstantly` routes production runs to `runsMetadataQueue` (a Redis hash plus a deduplicated flush job); only `TESTING` calls `flowRunRepo().save()` inline. So queued-but-unstarted async webhooks are *not* the only Redis-loss exposure — unflushed production run metadata is too. See [[flow-runs]].
2. **"Every webhook would pay a write / acceptance would drop whenever Postgres does"** — already true today. `handleAsync` calls `offloadPayload` unconditionally, and `fileService.save` ends in `fileRepo().save(...)` on every branch including S3. Async ingest already pays a synchronous Postgres INSERT and already fails on a Postgres outage.

The decision (Redis-only ACK) still describes what the code does; its stated cost/benefit does not. Whether to keep it should be re-argued against the real numbers, not these.
