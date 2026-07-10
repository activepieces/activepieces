# Benchmark CLI

## Summary
`activepieces benchmark` load-tests a deployment's sync-webhook path and diagnoses *where* latency goes, so a self-hosted setup can be compared apples-to-apples against Activepieces' published reference numbers. It builds a `webhook → data-mapper → return-response` flow, then instead of taking a raw `--concurrency`, it **auto-discovers the deployment's shape** (`GET /v1/worker-machines`) and derives the load from the effective **execution slot** count. After the run it attributes latency into queue-wait vs service-time from each `FlowRun.timeline`, validates the machine specs/settings against the recommended production setup, measures CLI→server network RTT, and checks S3 signed-URL upload + latency. A healthy deploy shows ~zero queue-wait by construction; any queue-wait it reports is a real finding (usually driven concurrency > slots).

## Key Files
- `packages/cli/src/lib/commands/benchmark.ts` — the whole command (auth, flow build, discovery, load, attribution, reporting)
- `packages/server/api/src/app/health/health.service.ts` + `health.module.ts` — the `GET /v1/health/diagnostics` endpoint (platform-admin) added for this feature: server-measured in-region DB/Redis/S3 round-trip latency + effective config + a worker summary (count, per-worker cores/cpu%/ram%), which a cross-region CLI cannot observe. Partial overlap with `/v1/health/system` and `/v1/worker-machines` is deliberate: `/diagnostics` intentionally repeats the worker summary so a single platform-admin call is a self-contained support bundle — the round-trip latency it adds exists on no other route.
- `packages/core/shared/src/lib/core/health/index.ts` — `GetDiagnosticsResponse` / `InfraCheck` / `DeploymentConfig` types
- Server endpoints the CLI reads: `GET /v1/health/system` (version + worker skew), `GET /v1/health/diagnostics` (infra latency + config), `GET /v1/worker-machines` (specs/slots/sandboxes), `GET /v1/worker-machines/queue-metrics` (live queue depth), `GET /v1/flow-runs?flowId=&createdAfter=` (per-run `timeline` + status outcomes), `GET /v1/flags` (config flags map)
- `benchmark/run-gke.sh` — GKE harness used to produce the published reference numbers

## Edition Availability
Community, Enterprise, Cloud. Setup discovery + infra diagnostics require a **platform-admin** token (`worker-machines` and `health/*` are `platformAdminOnly` USER); without it the CLI still runs the load test and per-run latency attribution, but skips specs/split validation and the infra round-trip block.

## Reproduction basis
To compare our reference deployment against a customer deployment apples-to-apples, the invariant is **concurrency = each deployment's own execution slots** (the CLI default), so neither side queues. The comparable numbers are then the server/worker-measured RUN/service-time and the infra round-trip — not a fixed concurrency (which would make a smaller deployment queue and reproduce the original "over-drove their slots" confusion). Edition note: the infra round-trip block is **self-hosted only** — `GET /v1/health/diagnostics` returns `FEATURE_DISABLED` on `AP_EDITION=cloud` (a Cloud platform-admin is a tenant, not the infra operator), and the CLI degrades gracefully to the rest of the report.

## Authoritative-latency design
The CLI runs from a different host/region than the API and workers, so every client-side number (autocannon latency, RTT, any CLI→S3 fetch) is network-polluted and is reported as *observational only*. All authoritative latency is server/worker-measured: the per-run QUEUE/PROVISION/BOOT/RUN split comes from `FlowRun.timeline` (timed inside the worker via `wideEvent.timed` in `sandbox.ts`; RUN includes the end-of-run S3 log backup), and the in-region DB/Redis/S3 round-trip latency comes from `GET /v1/health/diagnostics`. Caveat surfaced in the report: the QUEUE phase absorbs app↔worker clock skew (can clamp to 0 or inflate), so it is cross-checked against the live BullMQ queue depth.

## Domain Terms
- **Execution slot**, **queue-wait vs service-time** — see `packages/server/worker/CONTEXT.md`
- **RunTimeline** (`QUEUE / PROVISION / BOOT / RUN`) — `packages/core/execution/src/lib/flow-run/flow-run.ts`
