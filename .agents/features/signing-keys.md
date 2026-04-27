# Signing Keys (RSA Signing Keys)

## Summary
Signing Keys are RSA-4096 key pairs generated server-side for use in the Managed Auth (embedding) flow. The platform admin creates a signing key: the private key is returned exactly once and must be saved by the admin, while only the public key is stored in the database. The vendor's backend uses the private key to sign JWTs that Activepieces verifies using the stored public key when `POST /v1/managed-authn/external-token` is called. Gated by `platform.plan.embeddingEnabled`.

## Key Files
- `packages/server/api/src/app/ee/signing-key/signing-key-module.ts` — module registration with `embeddingEnabled` guard
- `packages/server/api/src/app/ee/signing-key/signing-key-controller.ts` — REST controller (CRUD + audit event on create)
- `packages/server/api/src/app/ee/signing-key/signing-key-service.ts` — service (add, list, get, delete)
- `packages/server/api/src/app/ee/signing-key/signing-key-generator.ts` — RSA-4096 key pair generation using Node.js `crypto`
- `packages/server/api/src/app/ee/signing-key/signing-key-entity.ts` — TypeORM entity
- `packages/shared/src/lib/ee/signing-key/signing-key-model.ts` — `SigningKey` type and `KeyAlgorithm` enum
- `packages/shared/src/lib/ee/signing-key/signing-key-response.ts` — `AddSigningKeyResponse` type (includes `privateKey`)
- `packages/shared/src/lib/ee/signing-key/signing-key.request.ts` — `AddSigningKeyRequestBody` schema
- `packages/web/src/features/platform-admin/api/signing-key-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/signing-key-hooks.ts` — React query hooks
- `packages/web/src/features/platform-admin/components/new-signing-key-dialog.tsx` — UI dialog showing the private key once on creation
- `packages/web/src/app/routes/platform/security/signing-keys/` — platform admin UI page

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.embeddingEnabled`. Module hook: `platformMustHaveFeatureEnabled((platform) => platform.plan.embeddingEnabled)`.

## Domain Terms
- **Signing Key**: An RSA key pair; only the public key is persisted; the private key is returned once on creation.
- **KeyAlgorithm**: Enum with value `RSA` (the only supported algorithm, using RS256 for JWT signing).
- **kid (Key ID)**: The `id` of the signing key, embedded in the JWT header by the vendor so Activepieces knows which public key to use for verification.

## Entity

Table name: `signing_key`

| Column | Type | Notes |
|---|---|---|
| id | ApId | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| platformId | ApId | FK to `platform` (RESTRICT on delete/update) |
| displayName | string | Human-readable label |
| publicKey | string | PEM-encoded RSA-4096 public key (PKCS#1 format) |
| algorithm | string | `KeyAlgorithm` enum — currently always `RSA` |

## Endpoints

All mount under `/v1/signing-keys`. All require `platformAdminOnly([USER])`.

| Method | Path | Auth | Response | Description |
|---|---|---|---|---|
| POST | `/v1/signing-keys` | Platform admin | `AddSigningKeyResponse` (201) | Generate a new key pair; private key returned once |
| GET | `/v1/signing-keys` | Platform admin | `SeekPage<SigningKey>` | List all public keys for platform |
| GET | `/v1/signing-keys/:id` | Platform admin | `SigningKey` | Get a single signing key |
| DELETE | `/v1/signing-keys/:id` | Platform admin | 200 | Delete a signing key |

`AddSigningKeyResponse` extends `SigningKey` with the one-time `privateKey: string` field.  
Creating a key fires a `SIGNING_KEY_CREATED` audit event.

## Service Methods

- `add({ platformId, displayName })` — generates an RSA-4096 key pair (PKCS#1 PEM format), saves the public key, returns `AddSigningKeyResponse` with `privateKey`.
- `list({ platformId? })` — returns all signing keys for the platform. Not paginated internally (wrapped in `SeekPage` with null cursors).
- `get({ id })` — fetches a single key by ID (no platformId filter — used by token extraction where only the `kid` is known).
- `delete({ platformId, id })` — deletes by platform + id; throws `ENTITY_NOT_FOUND` if not found.

## Key Generation

Uses Node.js `crypto.generateKeyPair` with:
- Algorithm: `rsa`
- Modulus length: 4096 bits
- Public key encoding: PKCS#1, PEM
- Private key encoding: PKCS#1, PEM

The private key is never stored and is only included in the creation response. The algorithm field is set to `KeyAlgorithm.RSA` for future extensibility.

## Relationship with Managed Auth

Signing Keys are the cryptographic foundation for the Managed Auth flow:
1. Admin creates a signing key → receives private key.
2. Vendor stores the private key and uses it to sign JWTs with `kid` set to the key's `id`.
3. On `POST /v1/managed-authn/external-token`, `externalTokenExtractor` reads `kid` from the JWT header, fetches the public key via `signingKeyService.get`, and verifies the JWT using RS256.
