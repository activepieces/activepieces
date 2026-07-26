---
icon: ⏱️
---

# Benchmark CLI

`activepieces benchmark` load-tests a deployment's sync-webhook path and attributes *where* latency goes, so a self-hosted setup can be compared apples-to-apples against Activepieces' published reference numbers. Available in CE, EE, Cloud.

### How it works
- Builds a `webhook → data-mapper → return-response` flow. Instead of a raw `--concurrency`, it **auto-discovers the deployment shape** (`GET /v1/worker-machines`) and drives load = the effective **execution slot** count, so a healthy deploy queues ~zero by construction. Any queue-wait it reports is a real finding (usually driven concurrency > slots).
- Attributes latency from each `FlowRun.timeline` into QUEUE / PROVISION / BOOT / RUN, cross-checked against live BullMQ queue depth.
- Also validates machine specs/settings, measures CLI→server RTT, and checks S3 signed-URL upload + latency.

### Authoritative-latency design
- The CLI runs from a different region than the API/workers, so **all client-side numbers (autocannon, RTT, CLI→S3) are network-polluted and reported observational only**.
- Authoritative latency is server/worker-measured: per-run split from `FlowRun.timeline` (`wideEvent.timed` in `sandbox.ts`), in-region DB/Redis/S3 round-trip from `GET /v1/health/diagnostics`.
- Caveat: the QUEUE phase absorbs app↔worker clock skew (can clamp to 0 or inflate) — hence the queue-depth cross-check.

### Key pieces
- `packages/cli/src/lib/commands/benchmark.ts` — the whole command.
- `GET /v1/health/diagnostics` (new, platform-admin) — server-measured infra latency + config + **app tier** + worker summary; a self-contained support bundle.
- **App Instance Registry** (`app-machine-cache.ts`): apps have no inbound healthcheck, so each self-registers into a Redis hash `appMachines` on its `systemSnapshot` tick; `list()` drops rows untouched >120s. Kept separate from `workerMachines` so an app is never counted as an execution slot. Write gated off on Cloud.

### Gotchas
- Auth is **platform API key only** (`AP_API_KEY`/`--api-key` + `--project-id`) — email/password login was removed; SERVICE principal gets the full diagnostic bundle.
- The infra round-trip block is **self-hosted only** — `/v1/health/diagnostics` returns `FEATURE_DISABLED` on `AP_EDITION=cloud` (a Cloud admin is a tenant, not the infra operator); the CLI degrades gracefully.

### Key files
Entry point: `benchmarkCommand`, a commander Command registered in `packages/cli/src/index.ts`.

- `packages/cli/src/lib/commands/benchmark.ts` — the whole command: auth, flow build, discovery, load, attribution, reporting. Its spec sits next to it.
- `packages/server/api/src/app/health/` — the `GET /v1/health/system` and `GET /v1/health/diagnostics` endpoints (service + module + metrics).
- `packages/server/api/src/app/workers/machine/` — `/v1/worker-machines` and `/queue-metrics` routes, plus `worker-capacity.ts` which computes execution slots.
- `packages/server/api/src/app/helper/app-machine-cache.ts` — the App Instance Registry, the `appMachines` Redis hash.
- `packages/server/api/src/app/helper/system-snapshot.ts` — the tick each app self-registers on.
- `packages/core/shared/src/lib/core/health/index.ts` — `GetDiagnosticsResponse` / `InfraCheck` / `DeploymentConfig` / `AppInstance` types.
- `packages/core/execution/src/lib/flow-run/flow-run.ts` — the `RunTimeline` phases the attribution reads.
- `packages/server/sandbox/src/lib/sandbox.ts` — where the per-run phases are timed inside the worker.
- [Execution Runtime](./index.md) — domain terms: execution slot, queue-wait vs service-time.
- `benchmark/` — the harness scripts, including `run-gke.sh` behind the published reference numbers.

Paths verified 2026-07-17.
