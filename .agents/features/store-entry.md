# Key-Value Store (Store Entry)

## Summary
The Store Entry feature provides a persistent key-value store that piece steps can read from and write to during flow execution. It is a backend-only feature — there is no user-facing UI. Each entry is scoped to a project and identified by a string key. Values are arbitrary JSON (stored as `jsonb`). The API is exclusively accessible by the flow engine (worker), using `securityAccess.engine()` on all three endpoints. Pieces use SDK helpers (`storage.get`, `storage.put`, `storage.delete`) which call these endpoints at runtime. The maximum key length is 128 characters and the maximum serialized value size is 512 KB.

## Key Files
- `packages/server/api/src/app/store-entry/store-entry.controller.ts` — REST controller (upsert, get, delete)
- `packages/server/api/src/app/store-entry/store-entry.service.ts` — CRUD service
- `packages/server/api/src/app/store-entry/store-entry-entity.ts` — TypeORM entity
- `packages/server/api/src/app/store-entry/store-entry.module.ts` — Fastify plugin registration
- `packages/shared/src/lib/core/store-entry/store-entry.ts` — `StoreEntry` type, `STORE_KEY_MAX_LENGTH`, `STORE_VALUE_MAX_SIZE`
- `packages/shared/src/lib/core/store-entry/dto/store-entry-request.ts` — `PutStoreEntryRequest`, `GetStoreEntryRequest`, `DeleteStoreEntryRequest`

## Edition Availability
- **Community (CE)**: Fully available — no plan flag required.
- **Enterprise (EE)**: Fully available.
- **Cloud**: Fully available.

## Domain Terms
- **StoreEntry**: A project-scoped key-value record. The `value` field is `unknown` (any JSON-serializable value).
- **STORE_KEY_MAX_LENGTH**: 128 characters — enforced on the `key` column and in the request schema.
- **STORE_VALUE_MAX_SIZE**: 512 KB (512 × 1024 bytes) — checked server-side using `object-sizeof` before upsert. Returns HTTP 413 if exceeded.
- **Upsert**: The write operation uses `upsert` on the composite unique constraint `(projectId, key)` — a put either inserts a new entry or overwrites the existing value for that key in the project.
- **sanitizeObjectForPostgresql**: Applied to values before storage to strip characters that cause issues in PostgreSQL jsonb.

## Entity

**store-entry**
| Column | Type | Notes |
|---|---|---|
| id | string | BaseColumnSchemaPart |
| created | timestamp | BaseColumnSchemaPart |
| updated | timestamp | BaseColumnSchemaPart |
| key | string | Max length 128 (`STORE_KEY_MAX_LENGTH`) |
| projectId | string | ApIdSchema |
| value | jsonb (nullable) | Any JSON value |

Unique constraint: `(projectId, key)` — one value per key per project.

## Endpoints

All routes are prefixed `/v1/store-entries`. All require `securityAccess.engine()` — only the flow engine (worker) can call these.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | engine | Upsert a key-value entry (create or overwrite) |
| GET | `/` | engine | Get entry by key; returns 404 if not found |
| DELETE | `/` | engine | Delete entry by key (no-op if not found) |

The `projectId` is taken from `request.principal.projectId` (set by the engine token), not from the request body — callers only provide `key` and `value`.

## Service Methods

**storeEntryService** (simple service pattern, no logger parameter)
- `upsert({ projectId, request })` — sanitizes the value, upserts by `(projectId, key)`, returns the resulting `StoreEntry`.
- `getOne({ projectId, key })` — returns `StoreEntry | null`. Controller returns 404 if null.
- `delete({ projectId, key })` — deletes the entry. Silent no-op if key does not exist.

## Request Schemas

- `PutStoreEntryRequest`: `{ key: string (max 128), value?: any }`
- `GetStoreEntryRequest`: `{ key: string }` (query param)
- `DeleteStoreEntryRequest`: `{ key: string }` (query param)

## Notes

- The size check (`sizeof(request.body.value) > STORE_VALUE_MAX_SIZE`) happens in the controller before calling the service, so oversized values never reach the DB.
- There is no list endpoint — the store is designed as an opaque key-value cache for piece logic, not a queryable dataset.
- The `value` column is nullable — a piece can explicitly store `null` or `undefined` as the value for a key.
- All queries are filtered by `projectId` obtained from the engine principal, satisfying multi-tenant isolation without any explicit join or filter in the request.
