---
icon: ⚡
---

# Action Runs

An **action run** executes a *single* piece action or code step directly, outside any flow — the unit of work behind MCP's `ap_run_action` and the chat `ap_execute_action` / `ap_run_code` tools. It replaces the old "temporary flow" hack: create a throwaway flow → graft one step → `flowRunService.test()` → poll `flow_run` for ≤120s → dig the step out of `run.steps` → best-effort delete the flow.

At this stage action runs are **execution only — nothing is persisted**. The caller gets the outcome in-process. The `action_run` table, its endpoints, and the "Action runs" UI tab land separately; see [Run tables architecture](./run-tables-architecture-flow-run-action-run-and-future-run-kinds.md).

### How it works
- **Dispatch**: `actionRunService(log).run({ projectId, platformId, step })` resolves the piece package, then submits `WorkerJobType.EXECUTE_ACTION` via `userInteractionWatcher.submitAndWaitForResponse` — **synchronous request/response**, the same mechanism as property resolution and auth validation. No polling, no queued flow job, **no retry**. See decision [Action runs dispatch as synchronous user-interaction jobs](../../decisions/000013-action-runs-dispatch-as-synchronous-user-interaction-jobs.md).
- **Engine**: `actionOperation` → `actionRunStepRunner.run({ step, operation })` runs the one step against `FlowExecutorContext.empty()` and returns `steps[step.name]`. The chat tool executor (`engine/src/lib/tools/index.ts`) calls the same primitive.
- **Outcome**: `deriveActionRunOutcome` maps the engine response to `{ status, output, logs, errorMessage }`. Status is a `FlowRunStatus`, of which only **SUCCEEDED / FAILED / TIMEOUT / INTERNAL_ERROR** are reachable — an action run is synchronous, so QUEUED and RUNNING never occur, and PAUSED is explicitly rejected.
- **Priority** `high`, not `critical`, so action runs never outrank the builder interactions a human is actively waiting on.

### Gotchas
- **Two timeouts, and the gap matters.** The worker caps the sandbox at 120s; the watcher budget is 130s, just above it, so the sandbox normally answers first and the watcher only backstops a worker that never replies (killed by a deploy or OOM). A watcher timeout maps to `TIMEOUT`, **never** `INTERNAL_ERROR` — reporting "the engine crashed while loading or executing the piece" when nothing ran sends the calling agent off debugging the piece instead of retrying.
- **`actionRunMode` disables the two flow-only behaviours** in `piece-executor.ts`: the progress reporter becomes a no-op (no flow run to stream to), and waitpoints are rejected by `assertActionRunCannotSuspend` as a plain `Error` (USER-level) so the step ends FAILED, not INTERNAL_ERROR — "this action only works inside a flow" is a usage error, not an engine bug, and must not page oncall.
- **FLOW-scoped store entries are not isolated.** `context.store` and `context.files` are HTTP-backed services needing only `internalApiUrl`, `engineToken` and `flowId`. With no real flow, `fromExecuteActionInput` substitutes the `DEFAULT_MCP_DATA` sentinel `flowId: 'mcp-flow-id'`. PROJECT-scoped entries are correct (scope comes from the token); FLOW-scoped entries all collapse onto that one shared namespace. `context.files` ignores `flowId`, so uploads are cleanly project-scoped.
- **`EXECUTE_ACTION` is in `UserInteractionJobData`**, so its payload shape is bound by `LATEST_JOB_DATA_SCHEMA_VERSION` — changing it needs a job-data migration.
- The old path's cleanup deleted the temp flow, and `flow_run.flowId` is `onDelete: CASCADE` — so it recorded nothing durable either, despite paying for three inserts per call.

### Editions
All editions (Community, Enterprise, Cloud). MCP `ap_run_action` is CE; the chat tools that use it are EE.

### Key files
Entry point: `actionRunService`, defined in `action-run.service.ts`.

- `packages/server/api/src/app/action-run/` — `action-run.service.ts` (`run()`), `action-run-outcome.ts` (engine response → terminal status)
- `packages/server/api/src/app/workers/user-interaction-watcher.ts` — `submitAndWaitForResponse`, now with an optional per-caller timeout
- `packages/server/api/src/app/mcp/tools/flow-run-utils.ts` — `executeActionRunAction` / `executeActionRunCode`, the rewrite that deleted the temporary-flow path
- `packages/core/execution/src/lib/engine/engine-operation.ts` — `EngineOperationType.EXECUTE_ACTION`, `ExecuteActionOperation`
- `packages/core/execution/src/lib/workers/job-data.ts` — `WorkerJobType.EXECUTE_ACTION`, `ExecuteActionJobData`
- `packages/server/engine/src/lib/handler/action-run-step-runner.ts` — the shared single-step primitive
- `packages/server/engine/src/lib/operations/action.operation.ts` — `actionOperation.execute`
- `packages/server/engine/src/lib/handler/context/engine-constants.ts` — `actionRunMode`, `fromExecuteActionInput`
- `packages/server/engine/src/lib/handler/piece-executor.ts` — the `actionRunMode` guards
- `packages/server/worker/src/lib/execute/jobs/execute-action.ts` — worker handler; 120s sandbox cap, sandbox timeout → `TIMEOUT`
