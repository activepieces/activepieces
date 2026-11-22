---
icon: 🔐
---

# Secret Managers

Lets platform admins connect Activepieces to an external secret store (HashiCorp Vault, AWS Secrets Manager, CyberArk Conjur, 1Password) so connection credentials resolve from the vault at runtime instead of the DB. Only app connection values are resolved (and the OAuth2 client id/secret), never flow step inputs. Reference syntax: `{{<connectionId><separator><path>}}`. Gated by `platform.plan.secretManagersEnabled` (EE/Cloud).

### Entity
`secret_manager_connection`: id, platformId (FK, CASCADE), providerId, name, scope (`PLATFORM`/`PROJECT`, default PLATFORM), projectIds (jsonb, queried with PostgreSQL `@>` containment), auth (jsonb, encrypted provider config).

### Providers
- `hashicorp` (url, namespace?, roleId, secretId), `aws` (accessKeyId, secretAccessKey, region), `cyberark-conjur` (organizationAccountName, loginId, url, apiKey), `onepassword` (serviceAccountToken).
- Path per provider: hashicorp `mount/data/path/key` (KV v2, at least 3 parts), aws `secretName:jsonKey` (the secret must be a JSON object), cyberark-conjur `policy/variable`, onepassword `op://vault/item/field`.

### How it works
- Endpoints under `/v1/secret-managers`: `GET` (list, `publicPlatform`: a platform admin lists all; anyone else must pass `projectId` and hold `READ_APP_CONNECTION` on it), `POST` (create + test), `POST /:id` (update + re-test), `DELETE /:id`, `DELETE /cache` (invalidate, optional `connectionId`). Every mutation is platform-admin only; `DELETE /cache` also takes a platform API key.
- Resolution: `resolveString` resolves a `{{connectionId|ap_sep_v1|path}}` key or returns it unchanged; `resolveObject` recurses; `resolveUnknownValue` dispatches; `containsSecretManagerReference` is an exported helper.
- Callers: app connection upsert (`throwOnFailure: true`), the engine's connection fetch at run time (`throwOnFailure: false`), OAuth2 authorization URL and refresh.
- Redis cache (`secret-manager-cache.ts`), 1 hour TTL: secret values (encrypted) keyed `(platformId, connectionId, path)` and connection status keyed `(platformId, connectionId)`; invalidated on create (whole platform), update/delete (one connection) or the cache endpoint.

### Gotchas
- Separator is `SecretManagerFieldsSeparator` (a constant in `@activepieces/shared`), the string `|ap_sep_v1|`, not a bare `|`.
- A value not wrapped in `{{ }}` or lacking the separator is treated as a plain literal (`SECRET_MANAGER_KEY_NOT_SECRET`), not an error.
- create/update validate connectivity via `provider.connect` before saving.
- At run time a failed lookup does not fail the fetch: the engine gets the raw `{{...}}` reference as the credential value, not an error.
- A project-scoped connection resolves only when its `projectIds` contains every project of the app connection (`@>`). Saving a global connection with a project outside that list fails with `Connection is not accessible`.
- Only a successful connection check is cached, so a disconnected row re-checks the vault on every list.
- Vault and Conjur calls go through `safeHttp`. A vault on a private or loopback IP needs `AP_SSRF_ALLOW_LIST`.
- The key icon in a connection dialog (`SecretInput`) shows only when the current project can use at least one connected secret manager connection. It lists by the current project, also in the global connections dialog.

### Key files
Entry point: `secretManagersModule`, registered twice in `packages/server/api/src/app/app.ts` (EE and Cloud editions).

- `packages/server/api/src/app/ee/secret-managers/` — module, controller, service, TypeORM entity, Redis cache
- `packages/server/api/src/app/ee/secret-managers/secret-manager-providers/` — one file per provider (aws, hashicorp, cyberark-conjur, onepassword) plus the dispatcher
- `packages/core/shared/src/lib/ee/secret-managers/` — dto types, provider configs, request schemas
- `packages/web/src/features/secret-managers/` — frontend api + hooks
- `packages/web/src/app/routes/platform/security/secret-managers/` — platform admin UI page (route `/platform/secret-managers`) and connect dialog
- `packages/web/src/app/connections/` — `SecretInput`, the key-icon toggle on connection credential fields
- `packages/server/api/test/integration/ee/secret-managers/` — integration tests plus a hashicorp mock
- `packages/server/api/src/app/app-connection/` — the main consumer, resolves references via `secretManagersService`

Paths verified 2026-11-22.
