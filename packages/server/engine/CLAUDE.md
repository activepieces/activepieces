# Engine

## Error Handling

- **Always throw `ExecutionError` subclasses** (from `@activepieces/shared`) instead of plain `Error`. The engine uses `tryCatchAndThrowOnEngineError` which only propagates errors of type `ExecutionErrorType.ENGINE` — plain `Error` instances are silently swallowed and treated as user-level failures.
- Use `EngineGenericError` for engine-level failures (e.g., failed API calls to the server).
- Use the existing specific error classes (`ConnectionNotFoundError`, `StorageLimitError`, `PausedFlowTimeoutError`, etc.) when applicable.

## USER vs ENGINE errors during input resolution

- A USER-level `ExecutionError` (e.g. `ConnectionNotFoundError` from a stale `{{connections.X}}` reference) must surface as a **FAILED step**, never `INTERNAL_ERROR`. `INTERNAL_ERROR` fails the worker job and pages oncall — reserve it for genuine engine bugs.
- **Actions**: resolve input (`getPropsResolver().resolve(...)`) **inside** the executor's `tryCatchAndThrowOnEngineError` wrapper. `code-executor`, `loop-executor`, and `router-executor` previously resolved outside it, leaking USER errors to `INTERNAL_ERROR`; `piece-executor` is the reference pattern.
- **Triggers**: input resolution runs in `runOrReturnPayload` (`flow.operation.ts`). `resolveStateOrThrowOnNonUserError` catches USER errors and routes them to `buildFailedTriggerContext` (FAILED trigger step), while rethrowing ENGINE errors so real bugs still page.

## Trigger step output

- A trigger step has **no meaningful `input`** — `input` is hardcoded `{}`. The raw event / payload lives in `output`: a successful trigger stores its `run()` result (or the raw payload when `executeTrigger: false`), and a failed trigger stores the raw event there too (via `.setOutput(...)` in `buildFailedTriggerContext`).
- This single slot is why retry reads `triggerStep.output` uniformly. The `executeTrigger` flag (derived from `status === FAILED` at retry time) decides whether `run()` reprocesses the payload or the stored result is replayed as-is. Do **not** add a separate `payload` field — it was tried and removed as redundant.
