---
icon: 🪪
---

# OAuth Apps

Lets platform owners register their own OAuth 2.0 app credentials (client ID + secret) per piece. When a platform has a custom OAuth app for a piece, the connection dialog uses those credentials instead of Activepieces' shared ones — giving vendors control over consent screens, rate limits, and branding. No plan flag gate.

### Entity
`oauth_app`: id, pieceName (e.g. `@activepieces/piece-google-sheets`), platformId (FK, CASCADE), clientId, clientSecret (jsonb, encrypted `EncryptedObject`). Unique index on `(platformId, pieceName)` — one credential set per piece per platform.

### How it works
- Endpoints under `/v1/oauth-apps`: `GET` (list, `publicPlatform` — any platform member), `POST` (upsert, platform admin), `DELETE /:id` (platform admin).
- Service: `upsert` (TypeORM upsert on conflict, encrypts secret), `getWithSecret` (decrypts, used internally during token exchange), `list`, `delete`.

### Gotchas
- The GET list is open to all platform members (not just admins) because the connection dialog must know which pieces have custom credentials — but only `clientId` is returned; `clientSecret` never leaves the server.
- clientSecret encrypted with the platform's encryption key.

### Key files
Entry point: `oauthAppModule`, registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/ee/oauth-apps/` — entity, service (encrypt/decrypt), and the module that carries the controller
- `packages/server/api/src/app/ee/app-connections/platform-oauth2-service.ts` — the consumer, calls `getWithSecret` during token exchange
- `packages/core/shared/src/lib/ee/oauth-apps/` — `OAuthApp`, `UpsertOAuth2AppRequest`, `ListOAuth2AppRequest` wire types
- `packages/web/src/features/connections/api/oauth-apps.ts` — frontend API client
- `packages/web/src/features/connections/hooks/oauth-apps-hooks.ts` — React query hooks
- `packages/web/src/app/routes/platform/setup/pieces/update-oauth2-dialog.tsx` — dialog for entering credentials

Paths verified 2026-07-17.
