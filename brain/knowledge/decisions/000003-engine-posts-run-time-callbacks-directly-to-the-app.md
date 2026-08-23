---
status: accepted
---

# Engine posts run-time callbacks directly to the app

## Decision
The engine posts all four run-time callbacks (`updateRunProgress`, `updateStepProgress`, `sendFlowResponse`, `uploadRunLog`) directly to the app over HTTP (`internalApiUrl` + `engineToken`, `POST /v1/engine/*`, ENGINE principal). The worker is removed from the data path; the engine→worker relay is deleted.

## Context
Historically the engine sent these over Socket.IO to the worker, which forwarded each verbatim to the app over a second hop — a 1:1 relay adding no value. The engine already talks to the app directly over HTTP for store/files/connections on that same channel.

## Why
Unifies local and remote runtimes: the engine reaches the app the same way regardless of where the pool runs. Kept it HTTP, not a new engine→app socket — three of the four are low-frequency, and the socket layer only accepts USER/WORKER principals, so ENGINE-on-socket would be a new auth surface for no present benefit.

## Consequences
`uploadRunLog` is dual-sourced and stays on the worker socket too: the worker still originates it to record a terminal status the engine couldn't report itself (crash, OOM, INTERNAL_ERROR), as a WORKER principal. One app-side service backs both entry points. This asymmetry is deliberate — a future reader will otherwise wonder why one of the four also lives on the worker socket.
