---
status: accepted
---

# A late unhandled rejection does not fail an already-returned code step

## Decision

In the Deno code-step harness (`buildRunProgram` in `deno.ts`), once a step's result has already been emitted (`settled === true`), a later `unhandledrejection` no longer fails the run. It is logged to the step's stderr (`Unhandled rejection after the step already returned a result: <message>`) and the process is left to exit on its own once its pending work drains. A rejection that arrives *before* the result is emitted still fails the run exactly as before.

## Context

A code step that starts an async call without awaiting it (e.g. `return { res: response.json(), ... }`, leaving `response.json()` unawaited) returns successfully, but the orphaned promise keeps running in the Deno process. If it later rejects — a non-JSON response body, a flaky network read — the step's run had already succeeded. Found via a cloud rollout flow (`fetch('https://web.bale.ai/')` with an unawaited `.json()`) that worked on the legacy Node sandbox and started failing after migrating to Deno, surfaced by the deploy-watch alert built for this rollout.

## Why

Legacy's child process (`no-op-code-sandbox.ts`) exits via `process.exit(0)` one tick after sending its success result. `process.exit()` tears down the process unconditionally, so a slower orphaned promise (real I/O takes far longer than one tick) never gets the chance to reject before the process is gone — legacy was never "correct" here, it was just unable to observe the failure. The Deno harness has no such exit call on the success path; the process stays alive until its pending work drains, which is what let the later rejection actually fire and fail the run via `Deno.exit(1)`.

The alternative — force an immediate exit after emitting the result, matching legacy exactly — was rejected: it would also kill deliberate fire-and-forget work the user's code started on purpose (e.g. "send a Slack notification without waiting for it"), which legacy also couldn't support but Deno's lazier shutdown allows today. Logging instead of silently swallowing keeps the rejection visible in the run's logs without retroactively failing a run whose result was already committed.

## Consequences

Orphaned promises that reject late no longer fail a run, matching legacy's effective behavior for this case, but the mistake is still discoverable (step logs carry the message) instead of vanishing the way it did under legacy. A rejection that fires before the result is emitted — including the same-tick case (`Promise.reject(...); return 1;`, pinned by the `'a promise left unhandled after the step returns'` case in `code-sandbox-error-contract.test.ts`) — is unaffected, since microtask-queue rejections there still resolve before the macrotask yield that precedes `emit(success)`.
