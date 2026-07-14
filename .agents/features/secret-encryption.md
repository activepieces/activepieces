# Secret Encryption at Rest

## Summary
All secrets stored in the database — app-connection credentials, project variables, AI
provider/tool keys, EE OAuth-app secrets, secret-manager configs, and the OIDC signing key — are
encrypted through a single chokepoint, `encryptUtils`. As of the CBC→GCM migration, secrets are
written with **AES-256-GCM** (authenticated encryption: ciphertext + 12-byte IV + auth tag). Blobs
written before the migration use **AES-256-CBC** (`{ iv, data }`, no auth tag) and are still
readable; a background sweep (`reencryptSecretsJob`) re-encrypts them to GCM in place.

The stored shape is `EncryptedObject = { iv, data, authTag? }`. **The presence of `authTag` is the
format discriminator**: absent ⇒ legacy CBC, present ⇒ GCM. The 32-character `AP_ENCRYPTION_KEY` is
the AES-256 key for both algorithms (`Buffer.from(secret, 'binary')` → 32 bytes) — the migration is
algorithm-only, no key rotation and no new env var.

The sweep is a one-shot system job (`SystemJobName.REENCRYPT_SECRETS`), single-runner via
`distributedLock`, keyset-paginated over each table's primary key, paced, restart-safe, and
idempotent. Its write-back is conditional on the exact CBC blob it read, so a concurrent re-auth is
never clobbered. It re-enqueues on every boot (dedup by `jobId`) and converges as legacy rows drain
to zero; it is removed in the Release-3 "contract" step once counts hit zero fleet-wide.

## Key Files
- `packages/server/api/src/app/helper/encryption.ts` — `encryptUtils` chokepoint: GCM write, dual-format read.
- `packages/server/api/src/app/helper/reencrypt-secrets.job.ts` — the migration sweep + blob registry.
- `packages/server/api/src/app/helper/system-jobs/common.ts` — `SystemJobName.REENCRYPT_SECRETS`.
- `packages/server/api/src/app/app.ts` — boot-time `register()` + fire-and-forget `enqueue()`.
- `packages/server/api/src/app/helper/system-validator.ts` — asserts `AP_ENCRYPTION_KEY` at startup.

### Encrypted-blob locations (what the sweep covers)
- `app_connection.value` (jsonb, highest volume), `variable.value` (jsonb), `ai_provider.auth`
  (json), `ai_tool_config.auth` (json) — all editions.
- `oauth_app.clientSecret` (jsonb), `secret_manager_connection.auth` (jsonb, nullable) — EE.
- `flag.value` (jsonb) — EE; **only** the row `id = 'OIDC_RSA_PRIVATE_KEY'` is encrypted (all other
  flag rows are plaintext, so the sweep restricts to that id).

## Edition Availability
All editions (Community, Enterprise, Cloud). The four core tables exist everywhere; the three EE
tables are swept when present and skipped (`42P01`) when absent.

## Domain Terms
Encrypted blob, auth tag, IV — see [Authentication & Security](../contexts/authentication/CONTEXT.md).
