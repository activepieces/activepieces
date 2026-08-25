---
title: Operational metrics ride the log drain, not a metrics pipeline
icon: 📡
status: accepted
---

# Operational metrics ride the log drain, not a metrics pipeline

## Decision

Postgres and Redis gauges are emitted as evlog **wide events** (`db.snapshot`, `redis.snapshot`,
`db.table`, `db.index`, `db.statement`, `redis.command`) carried by the same drain that already ships
logs to ClickHouse, each with `_forceKeep: true`. They are deliberately *not* pushed through
`otel-queue-metrics.ts`, the OTLP metrics exporter this repo already has.

## Context

We had no visibility into the database or the cache — only process memory, event-loop delay and queue
depth. The obvious home was the existing OTLP exporter, since a gauge is what a metrics system is for.
But the consumer we were building for is the debugging agent, and it already reads exactly one place:
the ClickStack `Logs` source, which `debug-failed-run` queries. The OTLP path is off by default
(`AP_OTEL_QUEUE_METRICS_ENABLED`), needs a collector endpoint, and would have put half the operational
picture behind a second query surface and a second piece of infrastructure a self-hoster has to stand up.

## Why

Wide events cost nothing new: the 60s tick, the drain and the ClickHouse table all existed, so this
shipped as one file plus a config flag with zero-setup defaults. One query surface also means one join —
correlating a slow request with the pool state and the table that lost its index is a single ClickHouse
query, not a stitch across two systems. The rejected alternative, proper OTLP gauges, buys real
time-series math (native rates, retention, downsampling) and a cardinality budget we now have to respect
by hand. We took the cheaper, more joinable option because the audience is an agent reading logs, not a
dashboard. The cost is paid in the query: counters are raw and cumulative, so a rate needs a window
function over two consecutive events.

## Consequences

Event names and field names are now a consumer-facing contract — the agent, the wiki page and any saved
query key on them, so renaming one is a breaking change to tooling even though it is invisible to users.
Metric volume lands in log retention and log cost, so a new tier has to justify itself against that
budget rather than against a cheap metrics store. If we ever do want native rates or long retention, the
migration is to re-emit the same collectors through OTLP and leave the events in place, not to move them.
