# Async webhook ACK is Redis-durable, not Postgres-durable

The async webhook endpoint returns `200` (with `x-webhook-id`) as soon as the job is enqueued to Redis — no Postgres row exists until a worker picks the job up. This keeps webhook ingest at Redis latency and lets ingestion survive a Postgres failover (flow resolution is served from a Redis cache), at the cost that a Redis dataset loss silently drops acknowledged webhooks inside the persistence window. We accept that trade-off and mitigate it with Redis persistence (AOF `everysec` → ≤1s exposure) rather than a durable-ACK write.

## Considered Options

- **Postgres write before ACK** (rejected): a run/intent row per webhook before returning `200` would make the ACK durable, but puts Postgres on the ingest hot path — every webhook pays a write, ingest throughput becomes bounded by Postgres, and webhook acceptance goes down whenever Postgres does. Sync webhooks already behave this way; async exists to avoid it.
- **Redis persistence as the durability knob** (chosen): the exposure window is the operator's `redis.conf`, documented in `docs/install/guarantees/disaster-recovery.mdx`.

## Consequences

- The `x-webhook-id` returned to the sender is not a durable receipt; it is only traceable once a worker starts the run.
- Everything else in Redis is rebuildable from Postgres (queue-migration refills rebuild schedules, renewals, and paused-run timers against a fresh Redis), so queued-but-unstarted jobs are the *only* Redis-loss exposure. Don't back up Redis; persist it.
