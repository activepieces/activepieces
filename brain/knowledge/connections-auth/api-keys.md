---
icon: 🗝️
---

# API Keys

Long-lived platform service credentials (prefixed `sk-`) for machine-to-machine API calls on behalf of a platform. Each key is 64 chars, stored only as a SHA-256 hash — the plaintext is returned once on creation and never again. Gated by `platform.plan.apiKeysEnabled` (EE/Cloud).

### Entity
`api_key`: id, platformId (FK, CASCADE), displayName, hashedValue (SHA-256, looked up every request), truncatedValue (last 4 chars for display), lastUsedAt (updated on each authenticated request).

### How it works
- Endpoints under `/v1/api-keys`, all `platformAdminOnly`: `POST` (create, returns `ApiKeyResponseWithValue` with raw value once), `GET` (list, `SeekPage` without value), `DELETE /:id`.
- Service: `add` (generates key, stores hashed/truncated), `getByValue` (lookup by SHA-256 hash, updates `lastUsedAt` — used by auth middleware), `list`, `delete`.

### Gotchas
- Key generated with `secureApId(61)` + `sk-` prefix = 64 chars; hashed with `cryptoUtils.hashSHA256`.
- Plaintext is only ever available at creation time.

### Key files
Entry point: `apiKeyModule`, registered on the Fastify app in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/ee/api-keys/` — the whole backend slice: module (routes + feature gate), TypeORM entity, service
- `packages/server/api/src/app/core/security/v2/authn/` — where `getByValue` is called to authenticate an incoming key
- `packages/core/shared/src/lib/ee/api-key/` — shared `ApiKey` types and request/response contracts
- `packages/web/src/features/platform-admin/api/api-key-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/api-key-hooks.ts` — React Query hooks
- `packages/web/src/app/routes/platform/security/api-keys/` — platform admin UI page and create dialog

Paths verified 2026-07-17.
