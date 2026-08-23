---
status: accepted
---

# Async webhook ACK is Redis-durable, not Postgres-durable

## Decision
The async webhook endpoint returns 200 (with `x-webhook-id`) as soon as the job is enqueued to Redis, with no Postgres row existing until a worker picks it up. Durability is tuned by Redis persistence (AOF `everysec`, so a window of up to 1s), not a durable-ACK write.

## Context
Sync webhooks write a Postgres row before ACK; async exists specifically to avoid putting Postgres on the ingest hot path. Making the ACK durable would mean a run/intent row per webhook before returning 200.

## Why
Keeping the ACK Redis-only holds ingest at Redis latency and lets it survive a Postgres failover (flow resolution is served from a Redis cache). Rejected a Postgres write before ACK: every webhook would pay a write, ingest throughput would be bounded by Postgres, and webhook acceptance would drop whenever Postgres does. The cost is accepted and tuned by the operator's `redis.conf`, documented in `docs/install/guarantees/disaster-recovery.mdx`.

## Consequences
A Redis dataset loss silently drops acknowledged-but-unstarted webhooks inside the persistence window, the only Redis-loss exposure, since everything else in Redis is rebuildable from Postgres.

- Queue-migration refills rebuild schedules, renewals, and paused-run timers against a fresh Redis, which is why queued-but-unstarted jobs are the only exposure.
- The `x-webhook-id` is not a durable receipt; it's traceable only once a worker starts the run.
- Don't back up Redis; persist it.
