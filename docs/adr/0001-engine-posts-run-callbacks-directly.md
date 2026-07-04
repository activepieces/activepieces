# Engine posts run-time callbacks directly to the app

## Status

accepted

## Context

A flow run emits four side-channel calls to the app while it executes:
`updateRunProgress`, `updateStepProgress`, `sendFlowResponse`, `uploadRunLog`.
Historically these were emitted by the **engine** over its Socket.IO control
socket to the **worker**, which forwarded each one verbatim to the app over a
second Socket.IO hop (`apiClient` / `WorkerToApiContract`). The worker added no
value on this path — `create-sandbox-for-job.ts` was a 1:1 relay.

Meanwhile the engine *already* talks to the app directly over HTTP for store,
files, connections, flows, and waitpoints, authenticated as an `ENGINE`
principal (`engineToken`, scoped per job) against `internalApiUrl` — a channel
the STRICT-mode SSRF guard already permits. The four callbacks were the only
engine→app traffic that did not use it.

## Decision

The engine posts all four callbacks **directly to the app over HTTP**, on the
existing `internalApiUrl` + `engineToken` channel, under `POST /v1/engine/*`
(authorized as the `ENGINE` principal, `projectId` derived from the token — the
engine cannot report into another project). The worker is removed from the data
path: the engine→worker `WorkerContract` is deleted and the worker's relay is
gone. Transport is HTTP (not a new engine→app socket): three of the four are
low-frequency, and the app's socket layer only accepts `USER`/`WORKER`
principals — adding `ENGINE`-on-socket would be a new auth surface for no
present benefit. If `updateStepProgress` streaming throughput ever demands it,
that single endpoint can move to a socket without disturbing the others.

This unifies the `LOCAL` and `GCP_CLOUD_RUN` runtimes: the engine reaches the
app the same way regardless of where the pool is hosted, so a remote pool needs
no channel back to the worker for these calls.

## Consequences

`uploadRunLog` is **dual-sourced** and stays on `WorkerToApiContract` as well:
the worker still originates it to record a terminal status the engine could not
report itself (crash, OOM, `INTERNAL_ERROR`), and it is a `WORKER` principal so
it cannot use an `ENGINE` token. The app-side logic lives in one service
(`engine-run-callback-service.ts`) called by both the worker socket handler and
the new engine HTTP endpoint. A future reader will otherwise wonder why three
callbacks are purely engine→app HTTP while `uploadRunLog` also lives on the
worker socket — this asymmetry is deliberate.
