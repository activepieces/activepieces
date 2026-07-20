# Piece Run

## Summary
A **piece run** executes a *single* piece action or code step directly, outside any flow — the unit of work behind MCP's `ap_run_action`, the chat tool executor, and piece-run API calls. It replaces the old "temporary flow" hack (create a throwaway `__pieceRun_<id>__` flow → graft one step → `flowRunService.test()` → poll `flow_run` for ≤120s → dig the step out of `run.steps` → best-effort delete the flow). That lifecycle wrote three real rows per call (flow, flow_version, flow_run), polled, and leaked `__pieceRun__` flows when the `finally` delete failed.

The replacement is a purpose-built engine operation, `EngineOperationType.EXECUTE_ACTION`, dispatched as a **synchronous user-interaction job** (`WorkerJobType.EXECUTE_ACTION`, same request/response mechanism as property/auth-validation jobs — no polling). The engine runs just that one step against an empty `FlowExecutorContext` and returns its `StepOutput`. Each run is persisted as a first-class `piece_run` entity (input/output/status/logs/source/user) for observability and a "Piece Runs" UI table, instead of polluting the flows/flow_runs tables.

## Key Files
- `packages/core/execution/src/lib/engine/engine-operation.ts` — `EngineOperationType.EXECUTE_ACTION`, `ExecuteActionOperation = BaseEngineOperation & { step: PieceAction | CodeAction }`
- `packages/core/execution/src/lib/workers/job-data.ts` — `WorkerJobType.EXECUTE_ACTION`, `ExecuteActionJobData`; priority `high` (not `critical`, so it never starves the truly-interactive builder jobs a human is waiting on); registered as a non-scheduled user-interaction job
- `packages/server/engine/src/lib/operations/action.operation.ts` — `actionOperation.execute`: runs the step, maps `StepOutputStatus.SUCCEEDED` → `success`, returns `{ success, input, output, message }`
- `packages/server/engine/src/lib/handler/piece-run-step-runner.ts` — `pieceRunStepRunner.run({ step, operation })`: `flowExecutor.getExecutorForAction(step.type).handle()` on `FlowExecutorContext.empty()`, returns `steps[step.name]`. Shared primitive — the chat tool executor (`tools/index.ts`) was refactored to call it too
- `packages/server/engine/src/lib/handler/context/engine-constants.ts` — `EngineConstants.pieceRunMode` flag; `fromExecuteActionInput` sets it true and fills flow identity from `DEFAULT_MCP_DATA` sentinels
- `packages/server/engine/src/lib/handler/piece-executor.ts` — honors `pieceRunMode`: no-op progress reporter, and `assertPieceRunCannotSuspend` (waitpoints rejected as USER errors → FAILED, not INTERNAL_ERROR)
- `packages/server/worker/src/lib/execute/jobs/execute-action.ts` — worker handler: resolves the piece, runs the engine op, maps sandbox timeout → `TIMEOUT`
- `packages/server/api/src/app/piece-run/piece-run.{entity,service,controller,module}.ts` — persistence + endpoints. `GET /v1/piece-runs` supports `status[]`, `source[]`, `createdAfter`, `createdBefore` filters (same query-param shape as the Flow Runs list; arrays via `OptionalArrayFromQuery`)
- `packages/server/api/src/app/mcp/tools/flow-run-utils.ts` — `executePieceRunAction` / `executePieceRunCode`: build one step and call `pieceRunService.run()` (the rewrite that deleted the temporary-flow path)
- `packages/core/execution/src/lib/piece-run/piece-run.ts` — `PieceRun` / `PopulatedPieceRun` schemas, `PieceRunSource` (MCP/CHAT/API), `PieceRunKind` (PIECE/CODE)
- `packages/web/src/features/piece-runs/` — "Piece Runs" table + detail sheet. Table has Status / Source / Created-range filters (Created defaults to the last 7 days, seeded into `createdAfter`/`createdBefore` query params, mirroring the Flow Runs page)

## Execution Flow
1. Caller (MCP/chat/API) builds a `PieceAction` or `CodeAction` step and calls `pieceRunService(log).run({ projectId, platformId, userId, source, step, connectionExternalId })`.
2. Service writes a `RUNNING` `piece_run` row (input sanitized via `sanitizeObjectForPostgresql`), resolves the piece package, then `userInteractionWatcher.submitAndWaitForResponse({ jobType: EXECUTE_ACTION, ... })` — **synchronous**, returns the engine response directly.
3. Worker `executeActionJob` resolves the piece and runs `EngineOperationType.EXECUTE_ACTION`; engine `actionOperation` → `pieceRunStepRunner` runs the single step.
4. Service derives `FlowRunStatus` from the engine response (`OK`+success → SUCCEEDED, `OK`+!success → FAILED, `TIMEOUT` → TIMEOUT, else INTERNAL_ERROR), updates the row with output/logs/errorMessage/finishTime.
5. `deleteStale()` purges rows older than `EXECUTION_DATA_RETENTION_DAYS`.

## How `context.store` and `context.files` work in piece-run mode
Both are **HTTP-backed services that call the server API**, not in-process objects — so an piece-run step uses them exactly as a real flow step does. In `piece-executor.ts` they're built purely from connection info:
- `store: createContextStore({ apiUrl: internalApiUrl, prefix: '', flowId, engineToken })`
- `files: createFileUploader({ apiUrl: internalApiUrl, engineToken })`

They need only `internalApiUrl` (where to call), `engineToken` (auth — carries project/platform scope), and `flowId` (store namespace only; `files` ignores it). `fromExecuteActionInput` supplies the first two from the operation, and substitutes `DEFAULT_MCP_DATA` sentinels (`flowId: 'mcp-flow-id'`, etc.) for the flow identity it lacks. The `engineToken` (minted for the `EXECUTE_ACTION` job, project/platform-scoped) is what makes store/file writes authorize and scope correctly. These are the same `mcp-` sentinels the existing MCP/chat tool executor already used.

**Caveat:** because `flowId` is the fixed constant `'mcp-flow-id'`:
- **PROJECT-scoped** store entries work and persist correctly (scope comes from the token; `flowId` ignored).
- **FLOW-scoped** store entries all collapse onto the single shared `'mcp-flow-id'` namespace — they function within a run but are **not isolated per piece run**.
- `context.files` has no caveat — it never touches `flowId`, so uploads are cleanly project-scoped.

## pieceRunMode guards (piece-executor)
A one-shot action has no flow context, so `pieceRunMode`:
- Swaps the live progress reporter for a no-op `update()` — there's no flow run to stream step progress to.
- Rejects waitpoints/pauses via `assertPieceRunCannotSuspend`, thrown as a **plain `Error` (USER-level)** so the step ends FAILED rather than INTERNAL_ERROR — "this action only works inside a flow" is a usage error, not an engine bug, and must not page oncall.

## Edition Availability
- Community / Enterprise / Cloud: all editions. Entity registered in `database-connection.ts`; the single migration `1812000000000-AddPieceRunTable` creates the `piece_run` table with all columns (including `userId`, `conversationId`, and the `archivedAt` soft-delete column) and its indexes.

## Domain Terms
- **piece run** — a single action/code execution outside any flow; persisted as a `piece_run` row.
- **`EXECUTE_ACTION`** — the engine operation + worker job type that runs one step synchronously.
- **`pieceRunStepRunner`** — shared engine primitive that runs one action against an empty context; backs both piece runs and the chat tool executor.
- **`pieceRunMode`** — `EngineConstants` flag that disables flow-only behavior (progress channel, waitpoints/suspend).
- **`DEFAULT_MCP_DATA`** — sentinel flow identity (`mcp-flow-id`, etc.) used when there is no real flow.
- **`PieceRunSource`** — `MCP` / `CHAT` / `API`; **`PieceRunKind`** — `PIECE` / `CODE`.
