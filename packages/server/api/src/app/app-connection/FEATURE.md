# App Connections Module

Manages OAuth2/API key/custom authentication credentials with automatic token refresh.

## Entity

**AppConnection**: id, displayName, externalId, type (AppConnectionType), status (ACTIVE/EXPIRED/ERROR), value (EncryptedObject), platformId, pieceName, pieceVersion, ownerId (nullable FK), projectIds[] (string array — multi-project), scope (PROJECT/PLATFORM), metadata (JSONB), preSelectForNewProjects (boolean).

## Connection Types (7)

| Type | Value Fields | Refresh |
|------|-------------|---------|
| OAUTH2 | access_token, refresh_token, client_id, client_secret, token_url, expires_in, claimed_at | Auto-refresh |
| CLOUD_OAUTH2 | Same but tokens exchanged via `secrets.activepieces.com` | Auto-refresh via cloud |
| PLATFORM_OAUTH2 | Same but uses platform-managed OAuth app credentials | Auto-refresh |
| SECRET_TEXT | token | None |
| BASIC_AUTH | username, password | None |
| CUSTOM_AUTH | piece-defined custom fields | None |
| NO_AUTH | (empty) | None |

## Scope

- **PROJECT**: Accessible to specific projects listed in `projectIds[]` array. Query with `ArrayContains([projectId])`.
- **PLATFORM**: Platform-wide, available to all projects.

## OAuth2 Token Refresh

Automatic on connection retrieval:
1. `decryptAndRefreshConnection()` checks if OAuth token expired (15-min early refresh threshold)
2. If expired: acquires distributed Redis lock (`key = ${projectId}_${externalId}`, 60s timeout)
3. Calls OAuth2 handler's `refresh()` method (different per type: cloud/platform/credentials)
4. Re-encrypts updated tokens, stores in DB, sets status=ACTIVE
5. On error (invalid refresh token): sets status=ERROR
6. Always strips refresh_token and client_secret from API responses

## Endpoints

- `POST /v1/app-connections` — create/upsert connection (validates via worker EXECUTE_VALIDATION job)
- `POST /v1/app-connections/:id` — update displayName, metadata, preSelectForNewProjects
- `GET /v1/app-connections` — list with filters (pieceName, displayName ILIKE, status, scope, externalIds)
- `GET /v1/app-connections/owners` — list connection owners (platform admins + project members)
- `POST /v1/app-connections/replace` — replace source connection with target across all flows
- `DELETE /v1/app-connections/:id` — hard delete
- `POST /v1/app-connections/oauth2/authorization-url` — generate OAuth redirect URL from piece metadata

## Connection → Flow Integration

- Flows reference connections by externalId in step settings
- `replace()` atomically updates all flow references (published + draft versions)
- Deleting a connection does NOT cascade to flows — flows fail at runtime with validation error

## Encryption

All connection values encrypted with `encryptUtils.encryptObject()` (AES-256) before storage, decrypted on retrieval.
