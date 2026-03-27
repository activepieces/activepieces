# @activepieces/shared

Types, DTOs, Zod schemas, and utilities shared across the entire Activepieces stack (server, web, worker, engine, pieces).

## Package Info

- **Version**: Managed in `package.json` (currently 0.47.0). ANY change requires a version bump (patch for fixes, minor for new exports).
- **Schema library**: Zod
- **Entry**: `src/index.ts` (barrel file re-exporting everything)

## Directory Structure

- `src/lib/automation/` — Flow, FlowRun, FlowVersion, Trigger, Actions, Tables, Pieces, Workers, AppConnection
- `src/lib/core/` — User, Flag, File, Tag, Authentication, Permission, ErrorCode, common utilities
- `src/lib/management/` — Platform, PlatformPlan, Project, ProjectRole, Invitations, AI providers
- `src/lib/ee/` — Enterprise types (billing, audit, git sync, SCIM, SSO, signing keys, embed)

## Defining Models (Zod Pattern)

Every model is BOTH a Zod schema AND a TypeScript type:

```typescript
import { z } from 'zod'
import { BaseModelSchema, Nullable, NullableEnum } from '../../core/common'

export enum MyFeatureStatus {
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
}

export const MyFeature = z.object({
    ...BaseModelSchema,     // id, created, updated
    name: z.string(),
    projectId: z.string(),
    status: NullableEnum(MyFeatureStatus),
    description: Nullable(z.string()),
})

export type MyFeature = z.infer<typeof MyFeature>
```

Key base schemas from `src/lib/core/common/base-model.ts`:
- `BaseModelSchema` — `{ id: z.string(), created: DateOrString, updated: DateOrString }`
- `Nullable(schema)` — `.nullable().optional()`
- `NullableEnum(enumObj)` — `z.nativeEnum(enumObj).nullable().optional()`
- `OptionalBooleanFromQuery` — coerces `"true"`/`"false"` strings
- `OptionalArrayFromQuery(schema)` — coerces single value to array

## Defining DTOs

```typescript
export const CreateMyFeatureRequest = z.object({
    projectId: z.string(),
    name: z.string(),
})
export type CreateMyFeatureRequest = z.infer<typeof CreateMyFeatureRequest>
```

## Key Utilities

From `src/lib/core/common/`:
- `apId()` — generates 21-char alphanumeric ID (nanoid). `secureApId(length)` for custom length.
- `isNil(value)` — type guard for `null | undefined`. `isEmpty(value)` — checks empty string/array/object.
- `spreadIfDefined(key, value)` / `spreadIfNotUndefined(key, value)` — conditional spread
- `tryCatch(asyncFn)` / `tryCatchSync(fn)` — returns `{ data, error }` discriminated union
- `ActivepiecesError({ code, params })` — error class with `ErrorCode` enum
- `SeekPage<T>` — cursor-based pagination type `{ data: T[], next, previous }`
- `formErrors` — `{ required: 'required' }` for form validation i18n
- `chunk(array, size)` — split array into chunks. `partition(array, pred)` — split into [truthy, falsy].
- `unique(array)` — deduplicate. `insertAt(array, index, item)` — insert at position.
- `omit(obj, keys)` — remove keys. `pickBy(obj, pred)` — filter by predicate.
- `deepMergeAndCast(target, source)` — deep merge objects/arrays
- `sanitizeObjectForPostgresql(input)` — removes null bytes for safe DB storage
- `kebabCase(str)`, `camelCase(str)`, `startCase(str)` — string case conversion
- `debounce(fn, wait)` — debounce function calls
- `applyFunctionToValues(obj, fn)` — async recursive value transform (sync version also available)

## Key Enums

- `Permission` (`src/lib/core/common/security/`) — 26 permissions: READ/WRITE for FLOW, RUN, TABLE, APP_CONNECTION, FOLDER, ALERT, MCP, PROJECT, PROJECT_MEMBER, INVITATION, PROJECT_RELEASE + UPDATE_FLOW_STATUS. Add new entries for new features.
- `ErrorCode` (`src/lib/core/common/activepieces-error.ts`) — 66 error codes mapped to HTTP statuses in `error-handler.ts`. Key mappings: ENTITY_NOT_FOUND→404, QUOTA_EXCEEDED/FEATURE_DISABLED→402, PERMISSION_DENIED→403, VALIDATION→409. Default: 400.
- `ApFlagId` (`src/lib/core/flag/flag.ts`) — 42 feature flags controlling UI and behavior. Add new flags here.
- `ApEdition` — `COMMUNITY = 'ce'`, `ENTERPRISE = 'ee'`, `CLOUD = 'cloud'`
- `FlowOperationType` — 26 operation types for flow modifications (ADD_ACTION, UPDATE_TRIGGER, LOCK_AND_PUBLISH, etc.)
- `FlowActionType` — `CODE`, `PIECE`, `LOOP_ON_ITEMS`, `ROUTER`
- `FlowRunStatus` — `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `PAUSED`, `TIMEOUT`, `CANCELED`, etc.
- `PauseType` — `DELAY`, `WEBHOOK`
- `BranchOperator` — 24 operators for router conditions (TEXT_CONTAINS, NUMBER_IS_GREATER_THAN, DATE_IS_BEFORE, LIST_IS_EMPTY, EXISTS, BOOLEAN_IS_TRUE, etc.)
- `StepOutputStatus` — `RUNNING`, `SUCCEEDED`, `FAILED`, `PAUSED`, `STOPPED`
- `AppConnectionType` — `OAUTH2`, `CLOUD_OAUTH2`, `PLATFORM_OAUTH2`, `SECRET_TEXT`, `BASIC_AUTH`, `CUSTOM_AUTH`, `NO_AUTH`
- `WorkerJobType` — 9 types: `EXECUTE_FLOW`, `EXECUTE_WEBHOOK`, `EXECUTE_POLLING`, `RENEW_WEBHOOK`, `EXECUTE_TRIGGER_HOOK`, `EXECUTE_PROPERTY`, `EXECUTE_VALIDATION`, `EXTRACT_PIECE_INFORMATION`, `EVENT_DESTINATION`
- `PieceCategory` — 17 categories (ARTIFICIAL_INTELLIGENCE, COMMUNICATION, COMMERCE, CORE, UNIVERSAL_AI, FLOW_CONTROL, etc.)
- `ApplicationEventName` — 19 audit event types (FLOW_CREATED/UPDATED/DELETED, FLOW_RUN_STARTED/FINISHED, CONNECTION_UPSERTED/DELETED, USER_SIGNED_UP/IN, etc.)
- `TelemetryEventName` — 26 tracked events for analytics

## PlatformPlan & Licensing

- `PlatformPlan` type (`src/lib/management/platform/`) — 40+ feature flags controlling what's enabled per platform
- `LicenseKeyEntity` type (`src/lib/ee/license-keys/`) — maps license features to plan flags
- Plan constants (`src/lib/ee/billing/index.ts`) — `STANDARD_CLOUD_PLAN`, `OPEN_SOURCE_PLAN`

## Export Rules

1. Export from feature barrel files (e.g., `src/lib/automation/tables/index.ts`)
2. Re-export from root `src/index.ts`
3. Bump version on every change
