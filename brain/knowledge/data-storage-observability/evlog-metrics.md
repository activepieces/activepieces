---
icon: 📈
---

# Logging & Metrics (evlog)

All structured logging goes through **evlog**. One wide event per unit of work (HTTP request, worker job, flow run) with all context as fields, shipped to a single remote drain. Metrics are derived from log fields on the backend — we do not run a separate metrics pipeline for application signals, with one exception (BullMQ queue depth as native OTLP gauges).

### Setup

- `evlogSetup.init` (`packages/server/utils/src/evlog-setup.ts`) wires `initLogger` with service/version/env, level + sampling, a redact list (secrets, tokens, `authorization`, `connection.value`, axios internals), and a `host` enricher that stamps `os.hostname()` on every event.
- Sampling: info sampled per `AP_SAMPLE_RATE_INFO`; warn/error always kept; extra keep rules for `status ≥ 400` and `duration > 2000ms`.
- Field-naming schema is a hard contract — see `packages/server/CLAUDE.md` "Structured Logging Field Schema". One concept = one dotted path (`flowRun.id`, `piece.name`, `job.type`), durations end in `Ms`, bytes in `Bytes`, reserved keys are auto-populated.

### Drains

`packages/server/utils/src/evlog-drains.ts` picks one remote destination by env, first match wins: **Axiom → HyperDX → Loki → Better Stack → generic OTLP**. All batch through a shared pipeline (100 / 5s, retry ×3, buffer 5000). In dev, an additional NDJSON file drain writes to `.evlog/logs/` so `/analyze-logs` and jq work locally.

### Log-based metrics

The drain destination (HyperDX/ClickStack, Loki, Better Stack) derives metrics from log fields at query time — that is the whole reason the field schema is strict. Typical shapes:

- `count() where error.code = 'X'` → error rate
- `p95(durationMs) group by path` → latency SLO
- `count() group by piece.name, flowRun.status` → per-piece failure rate

### System snapshot (process metrics on ClickStack)

Process-level CPU / memory / event-loop lag reach ClickStack **as evlog events**, not native metrics. Both API (`packages/server/api/src/app/helper/system-snapshot.ts`) and worker (`packages/server/worker/src/lib/utils/system-snapshot.ts`) run a `setInterval(..., 60_000)` that emits one wide event with:

- `event: 'system.snapshot'`, `host`
- `memRssMb`, `memHeapUsedMb`, `memHeapTotalMb`
- `eventLoopDelayP99Ms` (from `perf_hooks.monitorEventLoopDelay`)
- `queueCounts` (BullMQ, API only)

Emitted with `_forceKeep: true` so info-sampling cannot drop it. Dashboards and alerts for RSS / heap / event-loop lag are built on this event.

### BullMQ queue depth (real OTLP metrics)

The only signal that leaves as a **native metric**, not a log. Same 60s tick calls `otelQueueMetrics.push` (`packages/server/api/src/app/helper/otel-queue-metrics.ts`) which POSTs an OTLP gauge `bullmq.job.count` with `queue` + `state` attributes to `OTEL_EXPORTER_OTLP_ENDPOINT/v1/metrics`. Gated by `AP_OTEL_QUEUE_METRICS_ENABLED`. Queue-depth cardinality (queues × states) would bloat wide events, and gauges are the natural shape.

### Worker → App healthcheck (in-band, not evlog)

CPU / RAM / disk / per-executor RSS travel from worker to app **piggyback on every `apiClient.poll(machineInfo)` call** — see `buildMachineInfo` in `packages/server/worker/src/lib/worker.ts` (uses `systemUsage` from `packages/server/utils/src/system-usage.ts`). App caches it in `app-machine-cache.ts` and surfaces the fleet at `GET /v1/health/system`. This powers the Platform health page; it does **not** go to ClickStack.

### What lives where

| Signal | Source | Destination |
| --- | --- | --- |
| Latency / error / business KPIs | evlog wide events per request/job | ClickStack via drain — log-based metric |
| Process RSS / heap / event-loop lag | `system.snapshot` every 60s | ClickStack via drain — log-based metric |
| BullMQ queue depth by state | `otelQueueMetrics.push` every 60s | OTLP `/v1/metrics` — native gauge |
| Worker CPU / RAM / disk / executors | `apiClient.poll(machineInfo)` | App cache → `GET /v1/health/system` |
| Managed Postgres / Redis CPU / mem | DigitalOcean managed metrics | Betterstack (via `do-alerts@` group) |
| Hetzner host CPU / mem | host agent, if any | not in ClickStack |

### Gotchas

- **Missing `_forceKeep` drops your metric.** A recurring info-level snapshot without `_forceKeep: true` is subject to sampling — the value silently thins out at whatever `sampleRateInfo` is set to, and charts read as gaps or an inflated mean. Every periodic-metric event must set it.
- **Field-name drift breaks every log-based metric.** The same id logged as `runId` in one place and `flowRun.id` in another cannot be joined at query time. The schema in `packages/server/CLAUDE.md` is enforced by convention only — the drain will not warn.
- **`hyperdxToken` wins over `otlpEnabled`.** `resolveRemote` picks the first matching drain (Axiom → HyperDX → Loki → Better Stack → OTLP), so setting an Axiom or HyperDX token silently disables `AP_OTEL_ENABLED`. To send logs to a generic OTLP collector, unset the other provider tokens.
- **The Betterstack drain requires both `betterstackToken` and `betterstackHost`.** Setting only one silently falls through to the next drain.
- **Worker machine info is in-band with polling, not scheduled.** If a worker stops polling (crash, network partition), its numbers on the health page freeze — there is no separate heartbeat.

### Key files

- `packages/server/utils/src/evlog-setup.ts` — `evlogSetup.init` / `.flush`
- `packages/server/utils/src/evlog-drains.ts` — drain selection
- `packages/server/utils/src/system-usage.ts` — cgroup CPU / RAM readers
- `packages/server/api/src/app/helper/system-snapshot.ts` — API 60s tick
- `packages/server/worker/src/lib/utils/system-snapshot.ts` — worker 60s tick
- `packages/server/api/src/app/helper/otel-queue-metrics.ts` — OTLP gauge push
- `packages/server/api/src/app/helper/app-machine-cache.ts` — fleet cache for `/v1/health/system`
