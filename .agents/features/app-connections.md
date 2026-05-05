# App Connections

## Summary
App Connections store encrypted authentication credentials (OAuth2 tokens, API keys, basic auth, or custom piece-defined fields) that flow steps use to call external services. They support automatic OAuth2 token refresh with distributed locking, a dual-scope model (project-level or platform-wide), and a "replace" operation that atomically rewires all flow references from one connection to another. The module handles all OAuth2 variants: user-supplied credentials, platform-managed OAuth apps, and Activepieces-hosted cloud OAuth.

## Key Files
- `packages/server/api/src/app/app-connection/` — backend module (controller, service, entity)
- `packages/shared/src/lib/automation/app-connection/app-connection.ts` — core types, enums, and value union types
- `packages/shared/src/lib/automation/app-connection/dto/upsert-app-connection-request.ts` — upsert DTO
- `packages/shared/src/lib/automation/app-connection/dto/read-app-connection-request.ts` — list query DTO
- `packages/shared/src/lib/automation/app-connection/oauth2-authorization-method.ts` — OAuth2 authorization method enum
- `packages/web/src/features/connections/api/app-connections.ts` — frontend API client
- `packages/web/src/features/connections/api/global-connections.ts` — global (platform-scope) connections API client
- `packages/web/src/features/connections/hooks/app-connections-hooks.ts` — TanStack Query hooks (`appConnectionsQueries`, `appConnectionsMutations`)
- `packages/web/src/features/connections/hooks/global-connections-hooks.ts` — global connections hooks
- `packages/web/src/features/connections/utils/oauth2-utils.ts` — OAuth2 redirect URL helpers
- `packages/web/src/features/connections/utils/utils.ts` — name-uniqueness check helpers
- `packages/web/src/app/routes/connections/index.tsx` — project connections list page
- `packages/web/src/app/routes/platform/setup/connections/index.tsx` — platform-wide global connections page
- `packages/web/src/app/connections/new-connection-dialog.tsx` — new connection dialog wrapper
- `packages/web/src/app/connections/create-edit-connection-dialog.tsx` — create/edit connection form dialog
- `packages/web/src/features/connections/components/edit-global-connection-dialog.tsx` — edit global connection dialog
- `packages/web/src/features/connections/components/rename-connection-dialog.tsx` — rename connection dialog

## Edition Availability
- **Community (CE)**: Available — project-scoped connections fully supported.
- **Enterprise (EE)**: Available — platform-scoped (global) connections require `globalConnectionsEnabled` plan flag.
- **Cloud**: Available — same as EE; cloud OAuth2 uses `secrets.activepieces.com` for token exchange.

## Domain Terms
- **AppConnection**: An encrypted credential record bound to a platform and optionally scoped to one or more projects.
- **AppConnectionScope**: `PROJECT` (restricted to projects in `projectIds[]`) or `PLATFORM` (available to all projects).
- **AppConnectionType**: One of `OAUTH2`, `CLOUD_OAUTH2`, `PLATFORM_OAUTH2`, `SECRET_TEXT`, `BASIC_AUTH`, `CUSTOM_AUTH`, `NO_AUTH`.
- **externalId**: The stable identifier for a connection within a project; referenced in flow step settings (survives rename).
- **preSelectForNewProjects**: Boolean flag on platform-scope connections; when true, auto-added to `projectIds` for every new project.
- **Global connection**: A `PLATFORM`-scope connection managed from the platform admin UI, shared across all (or selected) projects.
- **Replace**: Atomic operation that rewrites all flow references (published + draft) from one connection's externalId to another's.

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

## Frontend

The project connections page (`/connections`) shows a data table with status badges, piece icons, scope indicators, and bulk-delete support. The `new-connection-dialog` opens `create-edit-connection-dialog` which renders piece-auth-specific form fields. The "Replace" action opens `replace-connections-dialog` which calls the replace endpoint. The platform admin global connections page (`/platform/setup/connections`) uses `global-connections-hooks` and surfaces `edit-global-connection-dialog` for managing platform-scope connections and their `projectIds` assignment. The builder uses `connection-select` inside step settings to pick or create connections inline.
