---
icon: 📡
---

# Logs & Operational Metrics

Every server log line is an **evlog wide event** — one self-contained JSON object per request or event, not a stream of correlated lines. `evlogSetup.init` (`packages/server/utils/src/evlog-setup.ts`) wires level mapping, the redact path list, sampling, and the drain; `apLogger` is the Fastify-facing logger on top.

**Drain** — exactly one remote drain wins, first match in `evlogDrains.resolve`: Axiom → HyperDX → Loki → BetterStack → OTLP → none. Production runs the **HyperDX** drain, which is what puts our logs in **ClickHouse** (the ClickStack `Logs` source the `debug-failed-run` skill queries). A local file drain (`.evlog/logs/*.jsonl`, NDJSON) can run *alongside* the remote one — that is what the `analyze-logs` skill reads.

**Sampling** — info is sampled by `AP_LOG_SAMPLE_RATE_INFO`; warn/error always kept, plus anything with `status >= 400` or `duration > keepSlowMs`. An operational metric must therefore be emitted with `_forceKeep: true` or it silently disappears at low sample rates.

**Periodic metric events** — all emitted with `_forceKeep`, all queryable in ClickHouse by `LogAttributes['event']`:

| Event | Cadence | What it carries |
| --- | --- | --- |
| `system.snapshot` | 60s, every replica | Process rss/heap, event-loop p99, BullMQ `queueCounts`, Postgres pool (`pgPoolWaiting` > 0 means the app is queuing on connections). Worker emits the same minus the pool. |
| `db.snapshot` | 60s, leader | `pg_stat_database` counters + `pg_stat_activity` rollup (`longestIdleInTransactionSeconds`, `ungrantedLockCount`) |
| `redis.snapshot` | 60s, leader | `INFO`: memory, evictions, hits/misses, `keysWithoutTtl` |
| `db.table` | 15m, leader | one event per table — `seqScan` vs `idxScan` on a big table *is* the unindexed query |
| `db.index` | 15m, leader | non-unique indexes >10MB with `idxScan = 0` |
| `db.statement` | 15m, leader | `pg_stat_statements` top-20, or `available: false` |
| `redis.command` | 15m, leader | per-command calls, `usecPerCall`, p50/p99 |

Leader election is a plain `SET key host EX ttl NX` on Redis, TTL just under the interval — cluster-wide
numbers are identical on every replica, so exactly one emits them per tick.

## Gotchas

- **Redact by exact path, not by pattern.** evlog patterns match *values* (regex over strings), not key names, so the ported pino list in `evlog-setup.ts` is exact dot-paths with wildcards manually expanded. Built-in PII patterns are deliberately **off** — they over-redacted business IDs and versions. A new secret-bearing field is invisible to the redactor until someone adds its literal path.
- **A metric tick must never throw.** Every collector is wrapped (`catch {}` in `system-snapshot.ts`, `tryCatch` in `infra-snapshot.ts`) — a monitoring tick that crashes the process is worse than no metric.
- **Cluster-wide gauges need a leader, not `distributedLock`.** `distributedLock.runExclusive` *waits* for the lock and then runs, so every replica would still emit. The dedup gate is `SET key host EX ttl NX`: the loser skips the tick entirely.
- **`SLOWLOG GET` carries command arguments** — for us that means flow payloads and cached connection values. If Redis slowlog is ever logged, emit the command name, duration and arg *count* only, never the args.
- **Counters are raw and cumulative.** Nothing is delta'd in-process (the leader can change between ticks, so a per-replica "previous value" would be wrong). Diff two consecutive events for a rate.
- **Postgres stats are extension-free by design.** `pg_stat_user_tables` (seq_scan vs idx_scan on a big table = the unindexed query) and `pg_stat_user_indexes` (`idx_scan = 0` = dead index) answer most of it from core catalog views. `pg_stat_statements` gives exact query text but is an extension — check `pg_extension` and degrade, never `CREATE EXTENSION` (managed Postgres, no custom extensions).

## Key files

- `packages/server/utils/src` — `evlog-setup.ts` (init + redact), `evlog-drains.ts` (drain resolution), `ap-logger.ts`
- `packages/server/api/src/app/helper` — `system-snapshot.ts` (per-process tick), `infra-snapshot.ts` (Postgres/Redis tiers + the SQL), `infra-snapshot-parsers.ts` (pure parsing, unit-tested)
- `packages/server/worker/src/lib/utils/system-snapshot.ts` — the worker's per-process tick
- `packages/server/api/src/app/health/health.service.ts` — `getDiagnostics`, the on-demand DB/Redis/S3 round-trip probe (self-hosted only)
