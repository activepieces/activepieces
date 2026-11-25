---
id: observability-opentelemetry-replaced-with-evlog
title: "Observability: OpenTelemetry replaced with evlog"
added: '2026-06-17'
order: 1
release: 0.85.4
---

Logging moved from pino + OpenTelemetry to [evlog](https://evlog.dev). Logs are now one rich event per request/job instead of many small lines, so the JSON shape changed.

**Traces and metrics are no longer exported.** OpenTelemetry tracing produced a huge volume of low-value spans — far more data (and cost) than it was worth — so we dropped it in favour of these wide events, which carry the same context in one place. `AP_OTEL_ENABLED=true` now sends **logs** only, over OTLP.

New optional env vars: `AP_LOG_SAMPLE_RATE_INFO` (percent of info logs to keep, default `100`) and `AP_LOG_KEEP_SLOW_MS` (always keep requests slower than this, default `2000`). Drain settings (`AP_AXIOM_*`, `AP_BETTERSTACK_*`, `AP_LOKI_*`, `AP_HYPERDX_TOKEN`) are unchanged.

#### What you need to do

Only if you ingest Activepieces telemetry — update log dashboards to the new shape, and move any trace- or metric-based monitoring to logs.
