# Self-Hosting & Install

How to deploy and operate self-hosted Activepieces Community Edition, plus the runtime architecture behind it. Source: `docs/install/`.

## Install options
- **Docker** (fastest) — single container using the embedded PGLite database. Good for trying it out.
- **Docker Compose** — the standard self-host: container plus **Postgres** and **Redis**.
- **Other** — Helm (Kubernetes), Railway/Easypanel/Elestio/Zeabur/PikaPods (1-click), AWS (Pulumi), GCP VM. Cloud Edition (cloud.activepieces.com) is the hosted option.

## Production setup
Sized from one number: **peak concurrent flows**. Shape is one flow per worker, a small worker fleet, a thin app tier in front, and managed Postgres/Redis/S3 in the **same region**. S3 is a hard requirement.
- Recommended config: `AP_WORKER_CONCURRENCY=1`, `AP_REUSE_SANDBOX=true`, `AP_EXECUTION_MODE=SANDBOX_CODE_ONLY`, `AP_FILE_STORAGE_LOCATION=S3`, `AP_S3_USE_SIGNED_URLS=true`.
- Sizing: `workers = peak concurrent flows`, `apps = ceil(workers / 10)`. A concurrency-1 worker is busy for a flow's whole duration (up to 10 min), so size by concurrent flows, not trigger rate. Size statically for peak; autoscaling lag can't defend the 30s sync-webhook budget.
- Roles are one image selected by `AP_CONTAINER_TYPE` (`APP` / `WORKER` / `WORKER_AND_APP`). Workers hold no DB/Redis creds; they reach the app only via `AP_FRONTEND_URL` with `AP_WORKER_TOKEN`.

## Operate & reference
- Configure & Operate: separate workers, sandboxing, enterprise license, SSL, S3, worker groups, app webhooks, OpenTelemetry, telemetry, rollback.
- Troubleshooting: BullBoard, reset password, truncated logs, websocket issues.
- Reference: environment variables, limits (flow run timeout 600s, sync webhook 30s, max webhook payload 25MB), breaking changes.
- Guarantees: crash recovery, disaster recovery, reserved resources, execution isolation.

## Architecture (the why)
Components: **App** (API + scheduling), **Worker** (polls jobs, runs a sandbox), **Sandbox** (isolated exec env), **Engine** (compiled TS that parses and runs flow JSON), **UI** (React). Third party: **Postgres** (main DB), **Redis** (BullMQ queue). Everything is queue-backed, so spikes queue and drain rather than drop. Scale by adding replicas. Deep dives: durable execution, waitpoints, network security, piece syncing, benchmark, latency, autoscaling.
