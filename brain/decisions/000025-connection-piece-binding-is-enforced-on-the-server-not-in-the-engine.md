---
title: Connection↔piece binding is enforced on the server, not in the engine
icon: 🔗
status: accepted
---

`AP_ENFORCE_CONNECTION_PIECE_BINDING` (default `false`) rejects a step that resolves a
connection created for a different piece — a Slack credential handed to a Google Sheets
step. The obvious place to check is the engine: it already receives the full `AppConnection`
from `GET /v1/worker/app-connections/:externalId`, so `connection.pieceName !== step.pieceName`
is a two-line local comparison with no wire change and a precise error message.

We check on the **server** instead. The engine sends the requesting step's piece name as a
query param and `app-connection-worker-controller.ts` rejects the mismatch before the value
is decrypted.

## Why

The engine cannot read the flag. Sandbox env is an explicit allowlist built in
`create-sandbox-for-job.ts` (`buildSandboxEnv`) from `SandboxSettings`, which comes from
`WorkerSettings` served by the app over the socket — `process.env` is **not** inherited.
Reading a new `AP_*` var in the engine means threading it through the shared
`WorkerSettingsResponse` type, the app's settings builder, `SandboxSettings`, and the env
builder: four packages and a rolling-deploy skew window, for a check the server can do for
free. (`AP_SANDBOX_PROPAGATED_ENV_VARS` is not a shortcut — it would make the flag require
two env vars to work.)

Server-side also puts the check at the boundary that hands out the decrypted secret, which
is the right place for a credential guard regardless of the plumbing argument.

## Consequences

- The engine must send `?pieceName=` from every connection-resolution path — props resolver
  and the piece `connections` manager, covering actions, triggers, trigger hooks, and
  dynamic/dropdown props. A future path that resolves connections and forgets the param is
  silently unenforced.
- The rejection travels as an HTTP error, so the engine recovers the reason from the
  response body's `code` (`MCP_PIECE_CONNECTION_MISMATCH` — reused, not a new code) and
  raises a USER-level `ConnectionPieceMismatchError`. Status alone is not enough: this
  endpoint returns 400 for zod failures too.
- **Code, loop and router steps have no piece and send no name, so they are never gated.**
  Turning the flag on does not stop a code step from reading any connection in the project.
  A platform that wants a real boundary must also disable code steps.

## Revisit when

The engine gains a general "app-pushed runtime config" channel — then the check could move
in-engine and gate the code-step hole too, since the engine knows which step is asking
whether or not that step has a piece.
