---
icon: 🔐
---

# Secret Managers

Lets platform admins connect Activepieces to an external secret store (HashiCorp Vault, AWS Secrets Manager, CyberArk Conjur, 1Password) so sensitive values in flow steps/connections resolve from the vault at runtime instead of the DB. Reference syntax: `{{<connectionId><separator><path>}}`. Gated by `platform.plan.secretManagersEnabled` (EE/Cloud).

### Entity
`secret_manager_connection`: id, platformId (FK, CASCADE), providerId, name, scope (`PLATFORM`/`PROJECT`, default PLATFORM), projectIds (jsonb, queried with PostgreSQL `@>` containment), auth (jsonb, encrypted provider config).

### Providers
- `hashicorp` (url, namespace?, roleId, secretId), `aws` (accessKeyId, secretAccessKey, region), `cyberark-conjur` (organizationAccountName, loginId, url, apiKey), `onepassword` (serviceAccountToken).

### How it works
- Endpoints under `/v1/secret-managers`: `GET` (list, `publicPlatform`), `POST` (create + test), `POST /:id` (update + re-test), `DELETE /:id`, `DELETE /cache` (invalidate).
- Resolution: `resolveString` resolves a `{{connectionId|path}}` key or returns it unchanged; `resolveObject` recurses; `resolveUnknownValue` dispatches; `containsSecretManagerReference` is an exported helper.
- Redis cache (`secret-manager-cache.ts`) caches secret values keyed `(platformId, connectionId, path)` and connection status keyed `(platformId, connectionId)`; invalidated on create/update/delete or the cache endpoint.

### Gotchas
- Separator is `SecretManagerFieldsSeparator` (a constant in `@activepieces/shared`, `|` in the reference form).
- A value not starting with `{{` or lacking the separator is treated as a plain literal (`SECRET_MANAGER_KEY_NOT_SECRET`), not an error.
- create/update validate connectivity via `provider.connect` before saving.

### Key files
Entry point: `secretManagersModule`, registered twice in `packages/server/api/src/app/app.ts` (EE and Cloud editions).

- `packages/server/api/src/app/ee/secret-managers/` — module, controller, service, TypeORM entity, Redis cache
- `packages/server/api/src/app/ee/secret-managers/secret-manager-providers/` — one file per provider (aws, hashicorp, cyberark-conjur, onepassword) plus the dispatcher
- `packages/core/shared/src/lib/ee/secret-managers/` — dto types, provider configs, request schemas
- `packages/web/src/features/secret-managers/` — frontend api + hooks
- `packages/web/src/app/routes/platform/security/secret-managers/` — platform admin UI page and connect dialog
- `packages/server/api/test/integration/ee/secret-managers/` — integration tests plus a hashicorp mock
- `packages/server/api/src/app/app-connection/` — the main consumer, resolves references via `secretManagersService`

Paths verified 2026-07-17.
