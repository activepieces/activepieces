---
title: AI usage is a streamed rollup; per-call detail belongs to traces
icon: 📊
status: accepted
---

# AI usage is a streamed rollup; per-call detail belongs to traces

## Decision

Every reported AI call becomes one event, appended to the Redis stream `ai-usage:events:v1` by a single Lua call that also drops retries (10-minute idempotency key) and marks a run's first AI call. The system job `AI_USAGE_FLUSH` folds the stream into `ai_usage_5m` (kept 3 days) and `ai_usage_daily` (kept 13 months) once a minute: one row per time bucket and series (project, flow, agent, user, key, model, origin, environment). It's not a per-call log. Own-key chat and agent calls, which bill once per turn, report each call with the `USAGE_ONLY` basis: recorded, never billed.

## Context

The first draft (#16619, v1) wrote one Postgres upsert per AI call. At Cloud peak, thousands of calls a second, that would queue a busy flow on its one daily row, leave dead row versions behind, and give no exactly-once guarantee.

## Why

- The hot path costs one Redis round trip and no Postgres writes.
- Postgres gets one batched transaction a minute.
- Exactly-once comes from a cursor saved in the same transaction with a compare-and-swap. A crash replays the batch, and a second concurrent flush rolls back. Redlock was rejected because it doesn't stop a run that has already lost the lock.
- Rejected alternatives:
  - a per-call `ai_trace` table: grows with every call;
  - hourly buckets: can't answer "last hour";
  - Autumn as the store: see decision 000053.

## Consequences

- Per-run cost isn't answerable from these tables; that stays with traces.
- `seriesId` is the first 32 hex characters of a sha256 of the dimension tuple (null = missing).
- Spend is frozen at write time:
  - managed calls: what we bill;
  - own keys: the reported cost, else the catalog estimate, else counted in `unpricedCalls`.
- Below about 20k events a second, one aggregator is enough. Above that, shard the stream by platform.
- CE with in-memory Redis can lose up to about a minute of usage on a restart.
