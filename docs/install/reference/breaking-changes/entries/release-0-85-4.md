---
id: release-0-85-4
title: "0.85.4"
added: '2026-06-17'
release: 0.85.4
legacy: true
---

### What has changed?

#### Observability: OpenTelemetry replaced with evlog
Logging moved from pino + OpenTelemetry to [evlog](https://evlog.dev). Logs are now one rich event per request/job instead of many small lines, so the JSON shape changed.

**Traces and metrics are no longer exported.** OpenTelemetry tracing produced a huge volume of low-value spans — far more data (and cost) than it was worth — so we dropped it in favour of these wide events, which carry the same context in one place. `AP_OTEL_ENABLED=true` now sends **logs** only, over OTLP.

New optional env vars: `AP_LOG_SAMPLE_RATE_INFO` (percent of info logs to keep, default `100`) and `AP_LOG_KEEP_SLOW_MS` (always keep requests slower than this, default `2000`). Drain settings (`AP_AXIOM_*`, `AP_BETTERSTACK_*`, `AP_LOKI_*`, `AP_HYPERDX_TOKEN`) are unchanged.

**Action:** only if you ingest Activepieces telemetry — update log dashboards to the new shape, and move any trace- or metric-based monitoring to logs.

#### Referencing step outputs
Previously if you had a step called step_1 you would had to reference it "step_1['the_property_you_want']" but now you must reference it as "step_1['output']['the_property_you_want']", there is already a migration that will take care of this for you, but if you must abide by this new syntax if you are writing/editing step references manually not through the builder.
You can now also reference the step error via "step_1['error']", these changes come with the error handling feature.
Also step names there were shown on hover in the builder are now removed, you can right click the step and copy its reference instead.

#### Enforcing same version of docker image on both worker and app servers
Previously if your worker was on a different version of your app server, the worker would work fine most of the time, but because some changes we do will require both of them to be on the same version we added this safeguard.
