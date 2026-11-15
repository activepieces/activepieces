---
icon: 🔑
---

# Key-Value Store

A persistent, project-scoped key-value store that piece steps read/write during flow execution. Backend-only, no UI. Values are arbitrary JSON (`jsonb`). Available in CE, EE, Cloud.

### Entities & services
- **StoreEntry**: `(projectId, key)` unique, `value` is any JSON. `store-entry.service.ts`: `upsert`, `getOne`, `delete`.
- Limits: key ≤ 128 chars (`STORE_KEY_MAX_LENGTH`), serialized value ≤ 512 KB (`STORE_VALUE_MAX_SIZE`).
- Pieces use SDK helpers `storage.get` / `storage.put` / `storage.delete`.

### How it works
- All routes under `/v1/store-entries` (POST upsert, GET, DELETE) require `securityAccess.engine()` — only the worker/engine can call them.
- `projectId` comes from the engine principal token, not the request body; callers send only `key`/`value`. This gives multi-tenant isolation for free.
- Upsert overwrites on the `(projectId, key)` unique constraint.

### Gotchas
- Value size check (`object-sizeof` > 512 KB → HTTP 413) happens in the controller before the DB.
- No list endpoint — it's an opaque cache, not a queryable dataset.
- `value` is nullable; a piece can store `null`/`undefined`. Values run through `sanitizeObjectForPostgresql` before storage.

### Key files
Entry point: `storeEntryModule`, registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/store-entry/` — the whole server slice: module, controller, service, TypeORM entity
- `packages/core/shared/src/lib/core/store-entry/` — `StoreEntry` type, the two limit constants, and the request DTOs
- `packages/server/engine/src/lib/piece-context/store.ts` — engine side that actually calls `/v1/store-entries`, builds the scoped key, maps errors
- `packages/server/api/test/integration/cloud/store-entry/` — controller integration tests
- `packages/server/api/src/app/app.ts` — where the module gets registered

Paths verified 2026-07-17.
