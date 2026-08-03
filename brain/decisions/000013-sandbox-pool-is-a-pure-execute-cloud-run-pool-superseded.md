---
status: superseded
---

# Sandbox pool is a pure execute() (Cloud Run pool, superseded)

## Decision
Superseded by "Worker is the Sandbox" for the hosting model. The sandbox pool is a pure `execute()` that holds no `apiClient` and no app connection; every input is passed in as request/response data (flow bundle + pieces as S3 refs). The worker is the sole Resolver, materializing inputs before calling execute. GCP Cloud Run was this same pool at concurrency 1 behind one `/execute` endpoint — that remote pool no longer exists.

## Context
Explored running the pool remotely on Cloud Run, which can't keep per-request affinity — so the lifecycle couldn't split into provision/run/dispose across the wire; it had to be one self-contained call.

## Why
A pure `execute()` gives local and remote an identical signature and needs no app connection (every input is data passed in). Rejected: Cloud Run opening its own socket to the app (pins a persistent connection onto a stateless runtime), and shipping heavy artifacts inline in the request body (chose S3 refs the pool pulls directly).

## Consequences
The remote Cloud Run / detached-pool hosting was removed — see "Worker is the Sandbox". The pure-execute shape survives (the Sandbox still holds no app connection and consumes only resolved inputs), but two things premised on a remote host are now retired:
- **ADR 0002 (pieces are links):** the bundle link being built from `publicApiUrl` was justified by "reachable from a detached remote pool." With no remote pool that reason is gone — the "links" decision still stands on its other merits (transport-uniform install, lazy S3 warm, always-a-working-link for self-hosters), but the public-URL basis is now incidental and could move to the internal URL. ADR files 0001/0002 marked superseded (2026-07-16), not deleted.
- **Worker→app routing:** for a standalone worker (`AP_CONTAINER_TYPE=WORKER`), `AP_FRONTEND_URL` is the base for ALL per-execution engine→app callbacks (`internalApiUrl`: worker/project, populated-flows, connections/props, run-progress, file I/O, piece serverContext.apiUrl). `publicApiUrl` (from the app's `PUBLIC_URL`) is only string injection (webhook URLs, serverContext.publicUrl) plus the cached, provisioning-time bundle download — not the per-request path. So pointing `AP_FRONTEND_URL` at the cluster-internal service keeps every callback off the public endpoint (avoids DNS + TLS + LB hairpin); it's safe because user-facing/public URLs come independently from `PUBLIC_URL`.
