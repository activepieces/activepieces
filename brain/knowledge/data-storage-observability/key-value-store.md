---
icon: 🔑
---

# Key-Value Store

A persistent, project-scoped key-value store that piece steps read/write during flow execution. Backend-only, no UI. Values are arbitrary JSON (`jsonb`). Available in CE, EE, Cloud.

### Entities & services
- **StoreEntry**: `(projectId, key)` unique, `value` is any JSON. `store-entry.service.ts`: `upsert`, `getOne`, `delete`.
- Limits: key ≤ 128 chars (`STORE_KEY_MAX_LENGTH`), serialized value ≤ 512 KB (`STORE_VALUE_MAX_SIZE`).
- Pieces call `context.store.get` / `put` / `delete` (the `Store` interface in `pieces-framework`), each with an optional `StoreScope`.

### How it works
- The engine scopes the key before the call (`createContextStore`): `StoreScope.PROJECT` keeps the raw key, `StoreScope.FLOW` (the default) stores `flow_<flowId>/<key>`. The Storage piece adds a **Run** scope on top of Flow: `run_<runId>/<key>`, with a fixed run id in test mode.
- All routes under `/v1/store-entries` (POST upsert, GET, DELETE) require `securityAccess.engine()` — only an engine token (`PrincipalType.ENGINE`) can call them.
- `projectId` comes from the engine principal token, not the request body; callers send only `key`/`value`. This gives multi-tenant isolation for free.
- Upsert overwrites on the `(projectId, key)` unique constraint.

### Gotchas
- Value size check (`object-sizeof` > 512 KB → HTTP 413) happens in the controller before the DB. The engine runs the same check first and throws `StorageLimitError`.
- **The 128-char limit counts the scoped key.** The Storage piece checks the raw key, but the API checks the scoped key (POST only), so a put with a Flow-scope key over 101 chars, or a Run-scope key over 75, fails with `StorageInvalidKeyError`. A step test leaves a Run-scope key only 63, because it uses the 33-char `testRunId` instead of a 21-char run id.
- **Nothing expires a store entry.** Only a piece delete removes one: the Storage piece's Remove action, or `context.store.delete`. There is no TTL, no UI and no user-facing route. Flow deletion and project deletion leave the rows: `store-entry` has no foreign key to `project`, and `deleteProjectLinkedEntities` skips it. Run-scope keys and Callable Flow's `callableFlow_<runId>` keys ([subflows](../flows-execution/subflows.md)) add rows that nothing removes.
- No list endpoint — it's an opaque cache, not a queryable dataset.
- `value` is nullable; a piece can store `null`/`undefined`. Values run through `sanitizeObjectForPostgresql` before storage.

### Key files
Entry point: `storeEntryModule`, registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/store-entry/` — the whole server slice: module, controller, service, TypeORM entity
- `packages/core/shared/src/lib/core/store-entry/` — `StoreEntry` type, the two limit constants, and the request DTOs
- `packages/server/engine/src/lib/piece-context/store.ts` — engine side that actually calls `/v1/store-entries`, builds the scoped key, maps errors
- `packages/pieces/core/store/src/lib/actions/` — the Storage piece; `getScopeAndKey` maps its Project / Flow / Run scopes
- `packages/server/api/test/integration/cloud/store-entry/` — controller integration tests
- `packages/server/api/src/app/app.ts` — where the module gets registered

Paths verified 2026-11-19.
