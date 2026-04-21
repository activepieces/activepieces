# Server Style Guide

Backend-specific conventions for `packages/server/*`. The root [CLAUDE.md](../../CLAUDE.md) covers cross-cutting rules (no `any`, named params, file order, comments-why-not-what, util exports, etc.) — read it first. This doc only adds what is specific to server code.

---

## 1. Services are namespaces, not classes

A backend service is exported as a function that takes `log: FastifyBaseLogger` and returns an object literal of methods. No classes, no constructor injection, no `this` inside methods.

```ts
// packages/server/api/src/app/flows/flow/flow.service.ts
export const flowService = (log: FastifyBaseLogger) => ({
    async create({ projectId, request, externalId, ownerId, templateId }: CreateParams): Promise<PopulatedFlow> {
        const folderId = await getFolderIdFromRequest({ projectId, folderId: request.folderId, folderName: request.folderName, log })
        // ...
        const savedFlowVersion = await flowVersionService(log).createEmptyVersion(savedFlow.id, { /* ... */ })
        // ...
    },
    async list({ projectIds, platformId, cursorRequest, /* ... */ }: ListParams): Promise<SeekPage<PopulatedFlow>> {
        // ...
    },
})
```

Callers instantiate per call site, threading the request logger through:

```ts
// inside a controller
const flow = await flowService(request.log).create({ /* ... */ })
```

**Why**: each call gets a fresh logger with per-request context, cross-service calls just pass `log` along (`flowVersionService(log).…`), and there is no DI framework or lifecycle to manage.

**Stateless variant** — when the service needs neither logging nor per-request state, export a plain object directly. This is the exception, not the rule.

```ts
// packages/server/api/src/app/tables/field/field.service.ts
export const fieldService = {
    async create({ request, projectId }: CreateParams): Promise<Field> { /* ... */ },
    async createFromState({ projectId, field, tableId }: CreateFromStateParams): Promise<Field> { /* ... */ },
}
```

Naming:

- `xxxService` — orchestrates business logic, talks to repos
- `xxxHelper` — smaller collaborator used by services (e.g. `s3Helper`, `appearanceHelper`)
- `xxxUtils` — pure utility functions grouped under one object (per root CLAUDE.md util rule)
- `xxxRepo` — thin `repoFactory(Entity)` export

---

## 2. The exported const is the namespace — helpers go below it

Read the file top-down like a table of contents: imports → **exported const** (the public surface) → helper functions → types. Helpers are implementation detail and must live **below** the const they support.

Think of the const as a namespace — it groups the public API. A reader sees what the module *does* before they see *how*.

```ts
// packages/server/api/src/app/flows/flow/flow.service.ts (shape)

// 1. imports
import { ActivepiecesError, apId, /* ... */ } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
// ...

// 2. repo export
export const flowRepo = repoFactory(FlowEntity)

// 3. the namespace — public contract, scannable first
export const flowService = (log: FastifyBaseLogger) => ({
    async create(/* ... */) { /* calls lockFlowVersionIfNotLocked, applyStatusChange */ },
    async list(/* ... */) { /* ... */ },
    async publish(/* ... */) { /* ... */ },
})

// 4. helpers — implementation detail, below the namespace
const lockFlowVersionIfNotLocked = async ({ flowVersion, userId, /* ... */ }: LockFlowVersionIfNotLockedParams): Promise<FlowVersion> => { /* ... */ }

async function applyStatusChange(params: { /* ... */ }, log: FastifyBaseLogger): Promise<void> { /* ... */ }

// 5. types at the bottom
type CreateParams = { projectId: ProjectId; request: CreateFlowRequest; /* ... */ }
type ListParams = /* ... */
```

Rules of thumb:

- **Never** inline a helper inside the const if it's more than a couple of lines — extract it below.
- **Never** put helpers or types above the exported const — the const is what the reader opened the file for.
- **Private helpers stay unexported.** Export a helper only when another module actually needs it (e.g. `getFolderIdFromRequest` in `flow.service.ts`).
- Helpers that need the logger take it as a named parameter — they do **not** close over a module-level `log`.

---

## 3. Group exports under a single `export const <fileName>` — don't export raw functions one-by-one

When a module exposes more than one related function or constant, group them under a single `export const` named after the file. A reader opens the file and sees the whole public API as one object, and callers read as `<fileName>.<fn>(…)` at the call site — self-documenting even after auto-import.

```ts
// ✅ Good — packages/server/utils/src/file-system-utils.ts
export const fileSystemUtils = {
    fileExists: async (path: string): Promise<boolean> => { /* ... */ },
    threadSafeMkdir: async (path: string): Promise<void> => { /* ... */ },
    // ...
}

// caller
await fileSystemUtils.fileExists(path)
```

```ts
// ❌ Bad — raw function exports scattered across the file
export async function fileExists(path: string): Promise<boolean> { /* ... */ }
export async function threadSafeMkdir(path: string): Promise<void> { /* ... */ }

// caller
await fileExists(path)   // no file/namespace context at the call site
```

Rules of thumb:

- **One exported const per file**, named after the file (kebab → camel): `iptables-lockdown.ts` → `iptablesLockdown`, `sandbox-capacity.ts` → `sandboxCapacity`.
- **Group by file, not by category.** The file *is* the grouping.
- **Exception — a single public entry point.** If the module exposes exactly one public function or class (e.g. `startEgressProxy`, a Fastify plugin like `flowController`), export it directly. The "group" is a group of one.
- **Error classes and types stay as named exports** (`export class BlockedHostError`, `export type EgressProxy`) — they don't belong inside the namespace const.
- Applies equally to `xxxService`, `xxxHelper`, `xxxUtils`, `xxxRepo` — they're all the same pattern under different names (see section 1).

---

## 4. Error handling: throw `ActivepiecesError` at boundaries, use `tryCatch` for recoverable failures

`@activepieces/shared` exports `tryCatch` / `tryCatchSync` (see [`try-catch.ts`](../shared/src/lib/core/common/try-catch.ts)) that turn throws into a discriminated `{ data, error }` result. Two distinct patterns, each with its place.

### 4a) Unrecoverable / contract violations — throw `ActivepiecesError`

For "this should not have happened" conditions — missing entities, validation failures, authorization failures — throw `ActivepiecesError` with an `ErrorCode`. Let it bubble up to the Fastify error handler.

```ts
if (isNil(flow)) {
    throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { entityType: 'Flow', entityId: id, message: 'Flow not found' },
    })
}
```

Convention: methods named `getOne` return `Thing | null`; methods named `getOneOrThrow` throw. Never mix the two behaviors in one method.

### 4b) Recoverable failures — destructure `{ data, error }` from `tryCatch`

When you need to *react* to a failure rather than propagate it (fallback path, retry, logging-and-continue, attempt-then-check), wrap the call in `tryCatch` and branch on `error`. **Do not** write raw `try { ... } catch { ... }` for this — it fragments control flow and loses the typed result.

```ts
// packages/server/worker/src/lib/execute/jobs/execute-flow.ts
const { data: provisioned, error: provisionError } = await tryCatch(
    () => provisionFlowPieces({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient }),
)
if (provisionError) {
    await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR)
    throw provisionError
}
// `provisioned` is narrowed to the success type from here
```

```ts
// packages/server/utils/src/file-system-utils.ts
fileExists: async (path: string): Promise<boolean> => {
    const { error } = await tryCatch(() => access(path))
    return error === null
},
```

For sync code, use `tryCatchSync` the same way.

Rules of thumb:

- **Early return on error**, then use `data` with its narrowed non-null type (the discriminated union gives you this for free).
- **Rename the result fields** when you have multiple calls in one function to avoid collisions: `{ data: provisioned, error: provisionError }`, `{ data: published, error: publishError }`.
- **Don't mix** `tryCatch` with a throw of the same error — pick one: either recover or propagate.
- **Raw `try/catch` is reserved for integration glue** where the `catch` block must invoke a side-effect handler (e.g. `exceptionHandler.handle(error, log)`) and continue down a different strategy. Example: the S3-upload fallback in `packages/server/api/src/app/file/file.service.ts`.
