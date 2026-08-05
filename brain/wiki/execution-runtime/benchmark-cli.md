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

### Gotchas — the GKE reference rig (`benchmark/run-gke.sh`)
The published reference numbers in `docs/install/architecture/benchmark.mdx` come from this rig, not from the CLI. Full method + results: `benchmark/EXPERIMENTS.md` Experiment 3 (re-measured 2026-07-30 on `origin/main` @ `805cc53cf7`: 213 / 484 / 641 / 777 req/s at 40 / 80 / 120 / 160 workers). Re-running it bites in ways the script does not check:

- **Generate load from INSIDE the cluster, or you measure your laptop.** Driving 120+ concurrent sync webhooks from a workstation exhausts its ephemeral ports (macOS ~16k; `hey` dies with `can't assign requested address`) and fabricates a *cliff at exactly the 120-worker tier* — 252 req/s, lower than the 80-worker tier, while the cluster sits healthy. External and in-cluster agree at 40 workers and diverge above 80. The old docs blamed a "120 cliff" on Postgres `max_connections=100`; that cliff reproduces with `max_connections=2000`, from the client side, so the original diagnosis was likely wrong.
- **Database CPU scales with throughput; the workers don't run out.** Postgres tracks *throughput* at ~2.5 millicores per req/s (529m → 2738m across the sweep) while workers idle at ≤0.1 of their 0.5-core cap. Any doc text claiming the singletons stay "flat and near-idle as the fleet quadruples" is wrong — that claim was contradicted by the numbers printed directly beneath it. **But do not overclaim the converse:** in this rig only the worker has a CPU *limit*; Postgres/Redis/app declare *requests* they can burst past, so their figures are consumption, not saturation. "PG is the bottleneck" is a hypothesis consistent with the trend, not something this run measured — proving it needs a hard-limited DB plus wait-event analysis.
- **Never publish numbers from two cluster shapes on the same page.** The docs once carried `93.5 / 148.9 req/s` (Experiment 1, `e2-standard-4` × 14) *and* `185.3 / 409.5 req/s` (a later `n2-standard-16` × 10 run) for the same `4 app · 40 w` / `8 app · 80 w` rows. Same ratio, same flow, different hardware — so the two disagreed by 2–3×. Every number on the page must come from one rig, and the diagram + `changelog.mdx` + `latency.mdx` cross-references have to move with it.
- **The rig config drifts away from the docs.** Committed `k8s-sandbox.yaml` pointed at bucket `ap-bench-usc-b3803` / `AP_S3_REGION: us-central1` (a bucket that no longer exists) while its own header comment and the docs both said `europe-west1`; `run-gke.sh` defaulted to `ZONE=us-central1-a` and `APP_CPU=1500m` against a documented `europe-west1-b` / 1 vCPU. Diff the manifest against the "Test environment" section before trusting a re-run.
- **`SSD_TOTAL_GB` is the quota that stops you**, not CPU. 10 × `n2-standard-16` with default `pd-balanced` 100 GB boot disks wants 1000 GB against a 500 GB regional limit and the cluster comes up `ERROR` with half its nodes. Use `--disk-type pd-standard` (4096 GB quota) — boot-disk type does not touch what is measured, since warm runs hit the local piece cache and Postgres runs on tmpfs.
- **Workers need `AP_LOG_LEVEL=info` or the per-run breakdown is empty.** The provision/boot/run split is read from the `job.execute` wide event, which evlog emits at info; the shared configmap sets `error`. Set it on the worker container only — putting the app at info makes webhook logging show up as app CPU and corrupts the app-vs-worker ratio finding.
- **Scope the log scrape to the measured pass.** `kubectl logs --since=20m` folds the cold first request and the warmup pass into the "warm" averages; capture the load start and use `--since-time`.

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
