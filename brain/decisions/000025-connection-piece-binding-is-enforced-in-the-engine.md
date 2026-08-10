---
title: Connection↔piece binding is enforced in the engine, and the flag rides worker settings
icon: 🔗
status: accepted
---

`AP_ENFORCE_CONNECTION_PIECE_BINDING` (default `false`) rejects a step that resolves a
connection created for a different piece — a Slack credential handed to a Google Sheets
step. Two places could hold the check: the server endpoint that hands out the decrypted
value (`app-connection-worker-controller.ts`), or the engine's `connection-resolver`.

It lives in the **engine**. The resolver already receives the full `AppConnection`, so the
check is a local `connection.pieceName !== pieceName` comparison — no query param, no new
error code, no change to the worker endpoint at all.

## Why not the server

The server variant looks safer (it rejects before decryption) but it buys nothing here: the
engine is the only caller of that endpoint, and it is the party that would have to declare
which piece is asking. A caller-supplied `?pieceName=` is exactly as trustworthy as a
caller-side comparison, so the extra wire field, the querystring DTO, and the HTTP round
trip of an error code back into an engine error class were pure cost.

## How the flag reaches the engine

`process.env` is **not** inherited by the engine: sandbox env is an explicit allowlist built
in `create-sandbox-for-job.ts` (`buildSandboxEnv`) from `SandboxSettings`, which comes from
`WorkerSettings` served by the app over the socket. So the flag follows the same path
`AP_DEV_PIECES` and `AP_SSRF_ALLOW_LIST` already take:

`AppSystemProp` → `machine-service.ts` (`WorkerSettingsResponse`) → `SandboxSettings` →
`buildSandboxEnv` → `process.env.AP_ENFORCE_CONNECTION_PIECE_BINDING` in the engine.

The var is emitted **only when true**, so the engine can read `=== 'true'` and an absent var
means disabled — never the `String(undefined)` → `'undefined'` trap. It is read at call
time, not at module load, so tests can toggle it. The operator sets it on the **app**
container; workers receive it through settings.

## Consequences

- Every connection-resolution path must pass the step's piece name — props resolver and the
  piece `connections` manager, covering actions, triggers, trigger hooks, and
  dynamic/dropdown props. A missing name is a denial, so a path that forgets it loses all
  connection access.
- **Code, loop and router steps have no piece, so they lose connection access entirely.**
  Deliberate — a code step runs arbitrary JS, so exempting it would leave the widest hole in
  the boundary. Enabling the flag breaks flows that feed a connection into custom JS.
- A worker on a stale `WorkerSettings` cache runs with the old value until it refetches.
