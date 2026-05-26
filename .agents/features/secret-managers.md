# Secret Managers (External Secret Storage)

## Summary
Secret Managers let platform admins connect Activepieces to an external secret management system (HashiCorp Vault, AWS Secrets Manager, CyberArk Conjur, or 1Password) so that sensitive values referenced in flow steps and connections are resolved from the vault at runtime rather than stored directly in the database. A secret reference uses the syntax `{{<connectionId><separator><path>}}`. The service resolves string and object values transparently before execution. Provider authentication config is encrypted at rest. Gated by `platform.plan.secretManagersEnabled`.

## Key Files
- `packages/server/api/src/app/ee/secret-managers/secret-managers.module.ts` — module registration with `platformMustHaveFeatureEnabled` guard
- `packages/server/api/src/app/ee/secret-managers/secret-managers.controller.ts` — REST controller
- `packages/server/api/src/app/ee/secret-managers/secret-managers.service.ts` — service with CRUD + resolution methods
- `packages/server/api/src/app/ee/secret-managers/secret-manager.entity.ts` — TypeORM entity
- `packages/server/api/src/app/ee/secret-managers/secret-manager-cache.ts` — Redis cache for secrets and connection status
- `packages/server/api/src/app/ee/secret-managers/secret-manager-providers/` — provider implementations (AWS, HashiCorp, CyberArk, 1Password)
- `packages/shared/src/lib/ee/secret-managers/dto.ts` — all types, provider configs, request schemas
- `packages/web/src/features/secret-managers/` — frontend components
- `packages/web/src/app/routes/platform/security/secret-managers/` — platform admin UI page

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.secretManagersEnabled`.

## Domain Terms
- **SecretManagerConnection**: A configured connection to an external secret manager instance.
- **SecretManagerProviderId**: Enum of supported providers: `hashicorp`, `aws`, `cyberark-conjur`, `onepassword`.
- **SecretManagerConnectionScope**: `PLATFORM` (accessible to all projects) or `PROJECT` (restricted to specific projects).
- **Secret Reference**: A string like `{{<connectionId>|<path>}}` where `|` is `SecretManagerFieldsSeparator`. Values wrapped in `{{ }}` that contain the separator are auto-resolved.
- **projectIds**: JSONB array column on `PROJECT`-scoped connections; queried with PostgreSQL `@>` containment operator.

## Entity

Table name: `secret_manager_connection`

| Column | Type | Notes |
|---|---|---|
| id | ApId | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| platformId | ApId | FK to `platform` (CASCADE DELETE) |
| providerId | string | `SecretManagerProviderId` value |
| name | string | Human-readable label |
| scope | string | `SecretManagerConnectionScope` (default `PLATFORM`) |
| projectIds | jsonb (nullable) | Array of project IDs for `PROJECT` scope |
| auth | jsonb (nullable) | Encrypted provider config (`EncryptedObject`) |

Index: `idx_secret_manager_connection_platform_id` on `platformId`.

## Endpoints

All mount under `/v1/secret-managers`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/secret-managers` | `publicPlatform` (USER) | List connections (platform-scoped or filtered by projectId) |
| POST | `/v1/secret-managers` | Platform admin (USER) | Create and test a new connection |
| POST | `/v1/secret-managers/:id` | Platform admin (USER) | Update and re-test an existing connection |
| DELETE | `/v1/secret-managers/:id` | Platform admin (USER) | Delete a connection |
| DELETE | `/v1/secret-managers/cache` | Platform admin (USER or SERVICE) | Invalidate cached secrets for a connection |

## Service Methods

- `list({ platformId, projectId? })` — returns all platform connections; if `projectId` is given, also includes `PROJECT`-scoped connections whose `projectIds @> [projectId]`. Checks live connection status for each entry.
- `create({ platformId, ...request })` — validates connectivity via `provider.connect`, encrypts config, saves entity, invalidates cache.
- `update({ id, platformId, request })` — re-validates connectivity, re-encrypts config, invalidates cache entry.
- `delete({ id, platformId })` — calls `provider.disconnect`, deletes entity, invalidates cache.
- `getSecret({ connectionId, path, platformId, projectIds? })` — fetches a secret value from the provider, with Redis caching. Enforces scope visibility.
- `resolveString({ key, platformId, projectIds?, throwOnFailure? })` — if `key` matches `{{connectionId|path}}` pattern, resolves the secret; otherwise returns `key` unchanged.
- `resolveObject({ value, platformId, projectIds?, throwOnFailure? })` — recursively resolves all string values in an object.
- `resolveUnknownValue(...)` — dispatches to `resolveString` or `resolveObject` based on value type.
- `containsSecretManagerReference(value)` — exported helper that checks if a value or nested object contains a `{{ }}` reference.

## Supported Providers

| Provider | `providerId` | Config Fields |
|---|---|---|
| HashiCorp Vault | `hashicorp` | `url`, `namespace?`, `roleId`, `secretId` |
| AWS Secrets Manager | `aws` | `accessKeyId`, `secretAccessKey`, `region` |
| CyberArk Conjur | `cyberark-conjur` | `organizationAccountName`, `loginId`, `url`, `apiKey` |
| 1Password | `onepassword` | `serviceAccountToken` |

## Caching

`secret-manager-cache.ts` uses Redis to cache:
- **Secret values**: keyed by `(platformId, connectionId, path)`. Avoids redundant vault calls per execution.
- **Connection status**: keyed by `(platformId, connectionId)`. Caches the reachability check result.

Cache is invalidated when a connection is created, updated, or deleted, or via the explicit cache DELETE endpoint.

## Secret Reference Format

```
{{<connectionId><SecretManagerFieldsSeparator><path>}}
```

Where `SecretManagerFieldsSeparator` is a constant string defined in `@activepieces/shared`. A value that does not start with `{{` or does not contain the separator is treated as a plain literal (error code `SECRET_MANAGER_KEY_NOT_SECRET`), not an error condition.
