# server-worker

## What this codebase does

BullMQ-backed job processor for Activepieces. Dequeues flow-run, webhook,
and trigger-poll jobs from Redis, marshals payloads, then invokes the
`server-engine` to execute the user's flow inside a sandbox. Also owns
sandbox lifecycle (provision, reuse, tear-down) under `src/lib/sandbox/`.
Runs as a separate process from the API; the API enqueues, the worker
dequeues.

## Auth shape

The worker has no inbound HTTP surface and therefore no user auth. It
trusts the API via the shared Redis queue and the shared Postgres DB
(connection string + project-isolation conventions inherited from the
API). The job payload is treated as trusted input from a peer; it should
still be schema-validated, since a malicious flow author can influence its
contents indirectly (webhook bodies, trigger outputs).

## Threat model

The dominant risks here are (1) **sandbox escape** during step execution —
same crown jewel as `server-engine`, but the worker owns the
`spawn`/`fork`/`isolate` wiring — and (2) **untrusted JSON deserialization
of webhook/trigger payloads** before the sandbox boundary. A third concern
is **job-id collision / duplicate processing** if BullMQ deduplication
keys are computed from user-controlled fields.

## Project-specific patterns to flag

- **`spawn`/`fork` whose argv or `cwd` includes user-controlled data.**
  All sandbox processes (`src/lib/sandbox/`) must use constant argv;
  code, payload, and config flow over stdin/IPC. Interpolating
  `flowId`, `runId`, or webhook input into argv is a finding.
- **Deserialization without schema.** Webhook bodies and trigger payloads
  are JSON.parse'd; downstream consumers MUST validate them against a Zod
  schema before passing to the engine. `JSON.parse(payload)` followed by
  direct property access on user-controlled keys is a finding.
- **Path traversal in sandbox workspace setup.** Sandbox provisioning
  writes per-run dirs under a sandbox root. Resolved paths MUST be
  asserted with `startsWith(sandboxRoot)` before any IO. A computed path
  derived from `flowVersionId`/`runId` without containment check is a
  finding.
- **Outbound HTTP from a worker code path that isn't `safeHttp`.** Same
  rule as the API: any `fetch` or `axios.create` on a URL sourced from
  job payload (e.g. piece sync URLs, webhook callback URLs) must use
  `safeHttp` from `@activepieces/server-utils`.
- **`exec`/`execSync`/shell strings.** Anywhere. The worker should never
  shell out.

## Known false-positives

- `src/lib/sandbox/isolate.ts` and `src/lib/sandbox/fork.ts` legitimately
  call `spawn()` / `fork()` to start sandbox children — that is the
  worker's job. The argv there is hardcoded and the code/payload flows
  over IPC; don't flag the spawn itself.
- Redis connection strings, log messages including `flowRunId`/`jobId`,
  and BullMQ internal metadata are non-secret. `logger.info({ jobId })`
  is fine.
- Re-throwing engine errors with the run id attached is intentional —
  flow authors need diagnostics. Sanitization happens at the API
  boundary before the run is exposed back to the user, not here.
