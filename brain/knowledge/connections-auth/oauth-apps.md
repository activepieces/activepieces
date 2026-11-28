---
icon: 🪪
---

# OAuth Apps

Lets platform owners register their own OAuth 2.0 app credentials (client ID + secret) per piece. When a platform has a custom OAuth app for a piece, the connection dialog uses those credentials instead of Activepieces' shared ones — giving vendors control over consent screens, rate limits, and branding. No server-side plan flag gate; the web button is disabled unless `platform.plan.managePiecesEnabled`.

### Entity
`oauth_app`: id, pieceName (e.g. `@activepieces/piece-google-sheets`), platformId (FK, CASCADE), clientId, clientSecret (jsonb, encrypted `EncryptedObject`). Unique index on `(platformId, pieceName)` — one credential set per piece per platform.

### How it works
- Endpoints under `/v1/oauth-apps`: `GET` (list, `publicPlatform` — any platform member), `POST` (upsert, platform admin), `DELETE /:id` (platform admin). All accept `PrincipalType.USER` only, so an API key cannot call them.
- Service: `upsert` (TypeORM upsert on conflict, encrypts secret), `getWithSecret` (decrypts, used internally during token exchange), `list`, `delete`.
- Web: `/platform/pieces` shows the lock button only for pieces with an OAuth2 auth whose grant type is not `CLIENT_CREDENTIALS` (`shouldShowOauth2SettingForPiece`). Unlock icon opens **Configure OAuth2 App**; once set, a red lock deletes the app on click, with no confirmation and no edit.
- Redirect URL the provider app must allow: `<AP_INTERNAL_URL or public URL>/redirect` (`federatedAuthnService.getThirdPartyRedirectUrl`). The Configure dialog does not show it.

### Gotchas
- The GET list is open to all platform members (not just admins) because the connection dialog must know which pieces have custom credentials — but only `clientId` is returned; `clientSecret` never leaves the server.
- clientSecret encrypted with the instance-wide `AP_ENCRYPTION_KEY` (`encryptUtils`), not a per-platform key.
- `getWithSecret` looks up by `(platformId, pieceName, clientId)`, and `refresh` passes the connection's stored `client_id`. Deleting the app, or saving a new Client ID, breaks refresh for every existing `PLATFORM_OAUTH2` connection until it is reconnected.
- **A `CLOUD_OAUTH2` claim result reaches the engine with no `type` field.** `cloudOAuth2Service.claim` returns `{ ...value, token_url, props }` without it, even though its own `refresh` sets `type` and `credentialsOauth2Service.claim` does too — and `upsert` hands the engine the un-merged claim result, so the request's `type` is re-spread for storage only. Any engine-side dispatch keyed on `authValue.type` therefore silently misses every cloud connection. **Do not work around it by narrowing the value's shape instead — pass the connection type into the operation.** The API knows the authoritative type (it comes from the request body) and is the only place that still has it, so engine operations carrying an `AppConnectionValue` should carry an explicit `connectionType` alongside it; `EXECUTE_RESOLVE_CONNECTION_IDENTIFIER` does. Shape narrowing looks equivalent and isn't: `'access_token' in authValue` discriminates, but `'props' in authValue` does **not**, because OAuth2 claim results also carry a `props` key (written explicitly by `claim`, so `in` is true even when the value is `undefined`). With a missing type, `getAuthPropertyForValue` also falls back to `pieceAuth.at(0)` for multi-auth pieces, so an arbitrary auth entry gets paired with a mismatched value — which shape checks on shared fields will wave straight through.

### Key files
Entry point: `oauthAppModule`, registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/ee/oauth-apps/` — entity, service (encrypt/decrypt), and the module that carries the controller
- `packages/server/api/src/app/ee/app-connections/platform-oauth2-service.ts` — the consumer, calls `getWithSecret` during token exchange
- `packages/core/shared/src/lib/ee/oauth-apps/` — `OAuthApp`, `UpsertOAuth2AppRequest`, `ListOAuth2AppRequest` wire types
- `packages/web/src/features/connections/api/oauth-apps.ts` — frontend API client
- `packages/web/src/features/connections/hooks/oauth-apps-hooks.ts` — React query hooks
- `packages/web/src/app/routes/platform/setup/pieces/update-oauth2-dialog.tsx` — dialog for entering credentials

Paths verified 2026-11-16.
