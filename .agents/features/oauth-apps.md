# OAuth Apps (Custom OAuth App Credentials)

## Summary
OAuth Apps allow platform owners to register their own OAuth 2.0 application credentials (client ID and client secret) for pieces that support OAuth. When a platform has a custom OAuth app registered for a piece, the connection dialog uses those credentials instead of Activepieces' shared credentials. This gives vendors full control over OAuth consent screens, rate limits, and branding. The client secret is encrypted at rest using the platform's encryption key. There is no plan flag gate — the module is available to all authenticated platform users.

## Key Files
- `packages/server/api/src/app/ee/oauth-apps/oauth-app.module.ts` — module registration + controller (both in one file)
- `packages/server/api/src/app/ee/oauth-apps/oauth-app.service.ts` — CRUD service with encryption
- `packages/server/api/src/app/ee/oauth-apps/oauth-app.entity.ts` — TypeORM entity
- `packages/shared/src/lib/ee/oauth-apps/oauth-app.ts` — `OAuthApp`, `UpsertOAuth2AppRequest`, `ListOAuth2AppRequest` types
- `packages/web/src/features/connections/api/oauth-apps.ts` — frontend API client
- `packages/web/src/features/connections/hooks/oauth-apps-hooks.ts` — React query hooks
- `packages/web/src/app/routes/platform/setup/pieces/update-oauth2-dialog.tsx` — UI dialog for configuring OAuth app credentials

## Edition Availability
No explicit plan flag gate. The module is available to all platform users (list endpoint uses `publicPlatform` security; create/delete use `platformAdminOnly`).

## Domain Terms
- **OAuth App**: A platform-scoped record mapping a piece name to its custom OAuth credentials.
- **pieceName**: The piece identifier (e.g., `@activepieces/piece-google-sheets`) that this credential applies to.
- **clientId**: The public OAuth 2.0 client identifier.
- **clientSecret**: The OAuth 2.0 client secret — stored encrypted as `jsonb`, decrypted on use.

## Entity

Table name: `oauth_app`

| Column | Type | Notes |
|---|---|---|
| id | ApId | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| pieceName | string | Piece identifier |
| platformId | ApId | FK to `platform` (CASCADE DELETE) |
| clientId | string | OAuth client ID |
| clientSecret | jsonb | Encrypted `EncryptedObject` |

Unique index: `idx_oauth_app_platformId_pieceName` on `(platformId, pieceName)` — enforces one credential set per piece per platform.

## Endpoints

All mount under `/v1/oauth-apps`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/oauth-apps` | Any platform member (`publicPlatform`) | List OAuth apps for platform (paginated) |
| POST | `/v1/oauth-apps` | Platform admin only | Upsert (create or replace) credentials for a piece |
| DELETE | `/v1/oauth-apps/:id` | Platform admin only | Remove credentials |

## Service Methods

- `upsert({ platformId, request })` — uses TypeORM `upsert` on `(platformId, pieceName)` conflict target. Encrypts `clientSecret` before saving. Returns the saved record without the secret.
- `getWithSecret({ platformId, pieceName, clientId? })` — fetches the record and decrypts the `clientSecret`. Used internally when performing OAuth token exchanges.
- `list({ platformId, request })` — paginated list of OAuth apps for a platform. Secrets are not included in list responses.
- `delete({ platformId, id })` — deletes by platform + id; throws `ENTITY_NOT_FOUND` if not found.

## Notes
- The GET list endpoint is accessible to all platform members (not just admins) because the connection dialog needs to know which pieces have custom credentials without exposing the secrets.
- Only `clientId` is returned in list/get responses; `clientSecret` is only used server-side during OAuth flows.
