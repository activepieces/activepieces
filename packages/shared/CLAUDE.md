# @activepieces/shared

Types, DTOs, Zod schemas, utilities. Version bump required on ANY change (patch for fixes, minor for new exports).

## Model Pattern

Zod schema + `z.infer` dual export. Use `BaseModelSchema` (id, created, updated), `Nullable()`, `NullableEnum()`. See any file in `src/lib/automation/` for examples.

## Key Utilities (`src/lib/core/common/`)

`apId()`, `isNil()`, `isEmpty()`, `tryCatch()`, `tryCatchSync()`, `spreadIfDefined()`, `spreadIfNotUndefined()`, `ActivepiecesError({ code, params })`, `SeekPage<T>`, `formErrors`, `chunk()`, `partition()`, `unique()`, `omit()`, `deepMergeAndCast()`, `sanitizeObjectForPostgresql()`, `kebabCase()`, `camelCase()`, `debounce()`, `applyFunctionToValues()`

## Key Enums (where to ADD new entries)

- `Permission` (`src/lib/core/common/security/`) — 26 permissions. Add READ/WRITE pairs for new features.
- `ErrorCode` (`src/lib/core/common/activepieces-error.ts`) — 66 codes. Also add HTTP mapping in server's `error-handler.ts`.
- `ApFlagId` (`src/lib/core/flag/flag.ts`) — 42 feature flags.
- `FlowOperationType` — 26 flow modification ops. Add new op types here + handler in flow service.
- `FlowActionType` — CODE, PIECE, LOOP_ON_ITEMS, ROUTER.
- `FlowRunStatus` — 12 states (QUEUED, RUNNING, SUCCEEDED, FAILED, PAUSED, TIMEOUT, CANCELED, etc.).
- `BranchOperator` — 24 condition operators for router.
- `WorkerJobType` — 9 job types. Add new jobs here + handler in worker.
- `ApplicationEventName` — 19 audit events. Add for new auditable actions.

## Export Rules

Export from feature barrel → re-export from `src/index.ts`.
