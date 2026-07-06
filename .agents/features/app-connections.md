# App Connections

## Summary
App Connections store encrypted authentication credentials (OAuth2 tokens, API keys, basic auth, custom piece-defined fields, or OIDC props) that flow steps use to call external services. They support automatic OAuth2 token refresh with distributed locking, a dual-scope model (project-level or platform-wide), and a project-scoped "replace" operation that rewires flow references from one connection to another. Platform/global connections can be selected as the replace source, but only project-scoped sources can be deleted afterwards — deleting platform connections stays exclusive to the platform admin page. The module handles all OAuth2 variants: user-supplied credentials, platform-managed OAuth apps, and Activepieces-hosted cloud OAuth. Users can optionally select a subset of a piece's declared OAuth2 scopes when creating a connection. OIDC connections enable pieces to obtain short-lived credentials from cloud providers (e.g. AWS via IRSA/Web Identity) using the Activepieces platform as an OIDC identity provider.

## Key Files
- `packages/server/api/src/app/app-connection/` — backend module (controller, service, entity)
- `packages/core/shared/src/lib/automation/app-connection/app-connection.ts` — core types, enums, and value union types
- `packages/core/shared/src/lib/automation/app-connection/dto/upsert-app-connection-request.ts` — upsert DTO
- `packages/core/shared/src/lib/automation/app-connection/dto/read-app-connection-request.ts` — list query DTO
- `packages/core/shared/src/lib/automation/app-connection/oauth2-authorization-method.ts` — OAuth2 authorization method enum
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
- `packages/web/src/app/connections/oidc-connection-settings.tsx` — OIDC connection form component
- `packages/server/api/src/app/core/security/oidc/oidc-key-manager.ts` — RSA key lifecycle: mutex-protected caching, auto-generation persisted (encrypted) to the shared `flag` table, RFC 7638 kid fingerprint
- `packages/server/api/src/app/core/security/oidc/oidc.module.ts` — module wrapper that registers the OIDC token controller under `/v1/worker`
- `packages/server/api/src/app/core/security/oidc/oidc-token.controller.ts` — engine-only endpoint that issues RS256 JWTs (`POST /api/v1/worker/oidc-token`)
- `packages/server/api/src/app/core/security/oidc/oidc-discovery.controller.ts` — public OIDC discovery endpoints (`GET /.well-known/openid-configuration`, `GET /.well-known/jwks.json`)

## Edition Availability
- **Community (CE)**: Available — project-scoped connections fully supported.
- **Enterprise (EE)**: Available — platform-scoped (global) connections require `globalConnectionsEnabled` plan flag.
- **Cloud**: Available — same as EE; cloud OAuth2 uses `secrets.activepieces.com` for token exchange.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **AppConnection**: An encrypted credential record bound to a platform and optionally scoped to one or more projects.
- **AppConnectionScope**: `PROJECT` (restricted to projects in `projectIds[]`) or `PLATFORM` (available to all projects).
- **AppConnectionType**: One of `OAUTH2`, `CLOUD_OAUTH2`, `PLATFORM_OAUTH2`, `SECRET_TEXT`, `BASIC_AUTH`, `CUSTOM_AUTH`, `NO_AUTH`, `OIDC`.
- **OIDCConnectionValue**: `{ type: OIDC, props: T }` — piece-defined OIDC props (role ARN, audience, etc.) stored encrypted; the actual token is fetched at runtime from the `POST /api/v1/worker/oidc-token` endpoint.
- **OIDC provider**: The Activepieces server acts as an OpenID Connect identity provider, exposing `/.well-known/openid-configuration` and `/.well-known/jwks.json` so cloud providers (e.g. AWS STS) can verify issued tokens.
- **OIDC kid**: Derived via RFC 7638 SHA-256 thumbprint of the RSA public key — rotates automatically when the key material changes, preventing JWKS cache poisoning.
- **externalId**: The stable identifier for a connection within a project; referenced in flow step settings (survives rename).
- **preSelectForNewProjects**: Boolean flag on platform-scope connections; when true, auto-added to `projectIds` for every new project.
- **Global connection**: A `PLATFORM`-scope connection managed from the platform admin UI, shared across all (or selected) projects.
- **Replace**: Project-scoped operation that rewrites matching flow references from one connection's externalId to another's, paginating through all matching flows. Draft versions are always updated; published versions are updated only when requested. Platform/global connections can be selected as the source, but requesting deletion of a platform source is rejected with `403` (mirrors the project-route delete guard). Deleting a project source is rejected with `409` while any published version the replace does not update still references it.

## Entity

**AppConnection**: id, displayName, externalId, type (AppConnectionType), status (ACTIVE/EXPIRED/ERROR), value (EncryptedObject), platformId, pieceName, pieceVersion, ownerId (nullable FK), projectIds[] (string array — multi-project), scope (PROJECT/PLATFORM), metadata (JSONB), preSelectForNewProjects (boolean).

## Connection Types (8)

| Type | Value Fields | Refresh |
|------|-------------|---------|
| OAUTH2 | access_token, refresh_token, client_id, client_secret, token_url, expires_in, claimed_at | Auto-refresh |
| CLOUD_OAUTH2 | Same but tokens exchanged via `secrets.activepieces.com` | Auto-refresh via cloud |
| PLATFORM_OAUTH2 | Same but uses platform-managed OAuth app credentials | Auto-refresh |
| SECRET_TEXT | token | None |
| BASIC_AUTH | username, password | None |
| CUSTOM_AUTH | piece-defined custom fields + optional `access_token`, `token_refresh_at` | Optional — piece opts in via `refresh` callback; server caches token with 15-min early-refresh buffer (clamped to half the token lifetime) |
| NO_AUTH | (empty) | None |
| OIDC | piece-defined props (e.g. role ARN, audience) — token fetched at runtime | None (short-lived JWT issued per-request) |

## OIDC Provider

Activepieces acts as an OIDC identity provider to enable pieces to assume cloud roles without long-lived credentials (e.g. AWS IRSA / Web Identity Federation).

**Runtime flow:**
1. Engine calls `POST /api/v1/worker/oidc-token` with `{ audience, expiresInSeconds? }` (engine-only endpoint, guarded by `securityAccess.engine()`)
2. Server issues a signed RS256 JWT with `sub: platform:{platformId}:project:{projectId}`, `aud` set to the requested audience (e.g. `sts.amazonaws.com`), TTL defaults to 1 hour (capped at 1 hour)
3. Piece exchanges the JWT with the cloud provider (e.g. AWS STS `AssumeRoleWithWebIdentity`) to get temporary credentials

**Caller contract** (pieces calling from `run()` via `context.server`):
- The JSON body is required: `audience` (non-empty after trim) is mandatory; `expiresInSeconds` is optional (integer, 60–3600, default 3600). Requests without a body get `400`.

```ts
const response = await fetch(`${server.apiUrl}v1/worker/oidc-token`, {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${server.token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audience: 'sts.amazonaws.com' }),
})
const { token } = await response.json()
```

**Discovery endpoints** (public, CORS-open, available when `system.isApp()` is true):
- `GET /.well-known/openid-configuration` — issuer metadata pointing to the JWKS URI
- `GET /.well-known/jwks.json` — RSA public key set; `kid` is an RFC 7638 SHA-256 thumbprint

**Key management** (`oidcKeyManager`):
- The signing key is read from the shared `flag` table (encrypted with the platform encryption key)
- If absent it is generated on first use and persisted there via `INSERT ... ON CONFLICT DO NOTHING` + re-read, giving first-writer-wins convergence across all nodes (single- and multi-node alike — no env var or manual provisioning required)
- Concurrent access is safe: `privateKeyMutex` and `publicKeyMutex` guard caching independently to avoid deadlocks

## Scope

- **PROJECT**: Accessible to specific projects listed in `projectIds[]` array. Query with `ArrayContains([projectId])`.
- **PLATFORM**: Platform-wide, available to all projects.

## OAuth2 Token Refresh

Automatic on connection retrieval:
1. `lockAndRefreshConnection()` checks if OAuth token expired (15-min early refresh threshold)
2. If expired: acquires distributed Redis lock (`key = ${platformId}_${externalId}`, 60s timeout) — keyed on the connection's project-invariant identity so projects sharing a connection serialize on one lock
3. Calls OAuth2 handler's `refresh()` method (different per type: cloud/platform/credentials)
4. Re-encrypts updated tokens, stores in DB, sets status=ACTIVE
5. On error (invalid refresh token): sets status=ERROR
6. Always strips refresh_token and client_secret from API responses

## Custom Auth Token Refresh

Opt-in on connection retrieval — piece authors define a `refresh` callback in `CustomAuthProperty`:

```ts
PieceAuth.CustomAuth({
  props: { ... },
  refresh: {
    generate: async ({ auth }) => {
      const res = await httpClient.sendRequest({ ... })
      return { access_token: res.body.token, expires_in: 3300 }
    },
    defaultExpiresIn: 3300, // seconds; used when generate() omits expires_in
  },
})
```

**Runtime flow:**
1. `needRefresh()` checks `connection.value.access_token`:
   - Present → stale once `now >= token_refresh_at` (the precomputed refresh instant)
   - Absent → consult `pieceRefreshSupportCache` (in-process LRU, 500 entries, 5-min TTL keyed by `pieceName@pieceVersion`); on cache miss, load piece metadata and check for `refresh` callback; result cached for future executions
2. If refresh needed: acquires the same distributed Redis lock (`key = ${platformId}_${externalId}`, 60s)
3. Dispatches `EXECUTE_TOKEN_REFRESH` worker job (user-interaction queue, same pattern as `EXECUTE_VALIDATION`)
4. Engine calls the piece's `refresh.generate()` callback, returns `{ access_token, expires_in? }`
5. `access_token` and `token_refresh_at` stored encrypted in `CustomAuthConnectionValue`, status=ACTIVE. `token_refresh_at = now + expiresIn - min(15 min, expiresIn / 2)` so the 15-min early-refresh buffer never exceeds half the token's lifetime (a short-lived token would otherwise be stale the instant it is minted); `expiresIn <= 0` means "never expires" → `token_refresh_at` is left unset
6. On **timeout**: uses existing credentials unchanged — does NOT mark connection ERROR
7. On **engine error** (non-OK status): throws `CustomAuthRefreshError` → sets status=ERROR
8. If piece has no `refresh` callback (returns `skipped: true`): clears stale `access_token`/`token_refresh_at` and sets cache to `false` so no further jobs fire

Inside piece actions/triggers, `context.auth.access_token` holds the cached token alongside the raw `props`.

## Endpoints

- `POST /v1/app-connections` — create/upsert connection (validates via worker EXECUTE_VALIDATION job)
- `POST /v1/app-connections/:id` — update displayName, metadata, preSelectForNewProjects
- `GET /v1/app-connections` — list with filters (pieceName, displayName ILIKE, status, scope, externalIds)
- `GET /v1/app-connections/owners` — list connection owners (platform admins + project members)
- `POST /v1/app-connections/replace` — replace a source connection with a target across the current project's flows; source may be project-scoped or platform/global, but `deleteSourceConnection` on a platform source is rejected with `403` (platform connections are deleted from the platform admin page)
- `DELETE /v1/app-connections/:id` — hard delete; rejects `PLATFORM`-scope connections with `403` (delete those via the platform admin `DELETE /v1/global-connections/:id` instead)
- `POST /v1/app-connections/oauth2/authorization-url` — generate OAuth redirect URL from piece metadata; accepts optional scopes array to restrict the authorization to a user-selected subset of the piece's declared scopes (all piece scopes used when omitted)

## Connection → Flow Integration

- Flows reference connections by externalId in step settings
- `replace()` updates the current project's flow references page by page (draft versions always, published versions when requested)
- When `deleteSourceConnection` is set, the server refuses up-front if any published version the replace will not update still references the source, and re-checks right before deleting that no flow still uses it; PLATFORM sources cannot be deleted through replace at all
- Deleting a connection does NOT cascade to flows — flows fail at runtime with validation error

## Encryption

All connection values encrypted with `encryptUtils.encryptObject()` (AES-256) before storage, decrypted on retrieval.

## Frontend

The project connections page (`/connections`) shows a data table with status badges, piece icons, scope indicators, and bulk-delete support. Bulk-delete operates only on `PROJECT`-scope rows — `PLATFORM`-scope (global) connections are filtered out client-side and the delete button reflects only the deletable count; global connections must be deleted from the platform admin global connections page. The `new-connection-dialog` opens `create-edit-connection-dialog` which renders piece-auth-specific form fields. The "Replace" action opens `replace-connections-dialog` which calls the replace endpoint. The platform admin global connections page (`/platform/setup/connections`) uses `global-connections-hooks` and surfaces `edit-global-connection-dialog` for managing platform-scope connections and their `projectIds` assignment. The builder uses `connection-select` inside step settings to pick, create, or reconnect connections inline; active connections show a "Connected" status with a compact reconnect icon, while connections needing re-authentication keep a "Reconnect" action.
