# Platform API Keys

## Summary
Platform API Keys allow platform admins to generate long-lived service credentials (prefixed `sk-`) that authenticate machine-to-machine API calls on behalf of the platform. Each key is 64 characters long, stored only as a SHA-256 hash (the plaintext is returned once on creation and never again). The truncated last 4 characters are stored for display purposes. Keys track `lastUsedAt` which is updated on every authenticated request. This feature is gated by `platform.plan.apiKeysEnabled`.

## Key Files
- `packages/server/api/src/app/ee/api-keys/api-key-module.ts` — module registration with `platformMustHaveFeatureEnabled` guard
- `packages/server/api/src/app/ee/api-keys/api-key-entity.ts` — TypeORM entity
- `packages/server/api/src/app/ee/api-keys/api-key-service.ts` — service (add, list, delete, lookup by value)
- `packages/shared/src/lib/ee/api-key/index.ts` — `ApiKey`, `ApiKeyResponseWithValue`, `ApiKeyResponseWithoutValue`, `CreateApiKeyRequest` types
- `packages/web/src/features/platform-admin/api/api-key-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/api-key-hooks.ts` — React query hooks
- `packages/web/src/app/routes/platform/security/api-keys/` — platform admin UI page

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.apiKeysEnabled`. The module registers the hook: `platformMustHaveFeatureEnabled((platform) => platform.plan.apiKeysEnabled)`.

## Domain Terms
- **API Key**: A platform-scoped service credential used for programmatic access.
- **hashedValue**: SHA-256 hash of the raw key, used for lookup on every request.
- **truncatedValue**: Last 4 characters of the raw key, shown in the UI for identification.
- **lastUsedAt**: ISO timestamp updated each time the key is successfully authenticated.

## Entity

Table name: `api_key`

| Column | Type | Notes |
|---|---|---|
| id | ApId (string) | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| platformId | ApId | FK to `platform` (CASCADE DELETE) |
| displayName | string | Human-readable label |
| hashedValue | string | SHA-256 of the secret key |
| truncatedValue | string | Last 4 chars for display |
| lastUsedAt | string (nullable) | ISO timestamp of last use |

## Endpoints

All endpoints mount under `/v1/api-keys`. All require `platformAdminOnly` access.

| Method | Path | Auth | Response | Description |
|---|---|---|---|---|
| POST | `/v1/api-keys` | USER (platform admin) | `ApiKeyResponseWithValue` (201) | Create a new key; returns raw value once |
| GET | `/v1/api-keys` | USER (platform admin) | `SeekPage<ApiKeyResponseWithoutValue>` (200) | List all keys for platform |
| DELETE | `/v1/api-keys/:id` | USER (platform admin) | 200 | Delete a key |

## Service Methods

- `add({ platformId, displayName })` — generates a 64-char `sk-...` key, stores hashed/truncated values, returns `ApiKeyResponseWithValue` (includes plaintext `value`).
- `getByValue(key)` — looks up by `hashedValue` using SHA-256; updates `lastUsedAt` on hit. Used by the authentication middleware.
- `list({ platformId })` — returns all keys for the platform (not paginated internally, wrapped in `SeekPage` with null cursors).
- `delete({ platformId, id })` — deletes by platform + id; throws `ENTITY_NOT_FOUND` if key is not found.

## Key Generation
Keys are generated with `secureApId(61)` prefixed with `sk-` to reach 64 characters total. The full value is hashed with `cryptoUtils.hashSHA256` for storage. The truncated display value is the last 4 characters of the raw key.
