# Embed

## Summary
Embed Onboarding lets a platform admin configure embedded workflows. The admin UI at `/platform/security/embed` (`packages/web/src/app/routes/platform/security/embed/`) renders a stepper:
- **Cloud edition**: 4 steps — register a Cloudflare custom hostname (`embed_subdomain`), verify DNS, set `allowedEmbedDomains` (frame-ancestors), create signing keys.
- **CE/EE editions**: 2 steps — set `allowedEmbedDomains`, create signing keys (no hostname/DNS — self-hosted uses `FRONTEND_URL`).

The cryptographic core is **Signing Keys**: RSA-4096 key pairs generated server-side for the Managed Auth flow. The platform admin creates a signing key — the private key is returned exactly once and must be saved by the admin; only the public key is stored. The vendor's backend uses the private key to sign JWTs that Activepieces verifies using the stored public key when `POST /v1/managed-authn/external-token` is called. Whole feature gated by `platform.plan.embeddingEnabled`.

`allowedEmbedDomains` lives on the `platform` table (alongside `allowedAuthDomains`) and is updated via `POST /v1/platforms/:id` (`UpdatePlatformRequestBody.allowedEmbedDomains`). The `embed-security` Fastify hook (`packages/server/api/src/app/helper/embed-security.ts`) reads this list per request to set the `Content-Security-Policy: frame-ancestors` header. See `managed-auth.md` for the JWT verification flow.

## Key Files
- `packages/server/api/src/app/ee/signing-key/signing-key-module.ts` — module registration with `embeddingEnabled` guard
- `packages/server/api/src/app/ee/signing-key/signing-key-controller.ts` — REST controller (CRUD + audit event on create)
- `packages/server/api/src/app/ee/signing-key/signing-key-service.ts` — service (add, list, get, delete)
- `packages/server/api/src/app/ee/signing-key/signing-key-generator.ts` — RSA-4096 key pair generation using Node.js `crypto`
- `packages/server/api/src/app/ee/signing-key/signing-key-entity.ts` — TypeORM entity
- `packages/core/shared/src/lib/ee/signing-key/signing-key-model.ts` — `SigningKey` type and `KeyAlgorithm` enum
- `packages/core/shared/src/lib/ee/signing-key/signing-key-response.ts` — `AddSigningKeyResponse` type (includes `privateKey`)
- `packages/core/shared/src/lib/ee/signing-key/signing-key.request.ts` — `AddSigningKeyRequestBody` schema
- `packages/web/src/features/platform-admin/api/signing-key-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/signing-key-hooks.ts` — React query hooks
- `packages/web/src/features/platform-admin/components/new-signing-key-dialog.tsx` — UI dialog showing the private key once on creation
- `packages/web/src/app/routes/platform/security/embed/` — platform admin UI page (Embed Onboarding)

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.embeddingEnabled`. Module hook: `platformMustHaveFeatureEnabled((platform) => platform.plan.embeddingEnabled)`.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

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

## Embed SDK (`packages/ee/embed-sdk`)

`ActivepiecesEmbedded` (bundled to `https://cdn.activepieces.com/sdk/embed/<version>.js`) drives the vendor↔client postMessage handshake: SDK appends iframe → client posts `CLIENT_INIT` → SDK posts `VENDOR_INIT` (jwt, initialRoute, flags) → client exchanges the token via `POST /v1/managed-authn/external-token`, registers its `VENDOR_ROUTE_CHANGED` listener, then posts `CLIENT_CONFIGURATION_FINISHED` (`packages/web/src/app/routes/embed/index.tsx`).

- **navigate() deferral**: `navigate()` before `CLIENT_CONFIGURATION_FINISHED` would vanish (the client listener isn't registered yet), so the latest route is kept in `_pendingRoute` (last-wins, bounded by construction) and applied when configuration finishes. Flushing on that event is race-free because the client registers the route listener before posting it. Deferral logs a `warn`; with no `embedding.containerId` configured, `navigate()` logs an error (no iframe will ever exist).
- **Reconfigure teardown**: the cleanup closure (`_cleanDashboardIframe`) is armed before the container poll starts, so a `configure()` superseded even mid-poll is cancelled (no second iframe). All dashboard `message` listeners are registered with one `AbortSignal`; cleanup aborts it, removes the iframe, and resolves the superseded `configure()` promise with `{ status: 'superseded' }`. `configure()` also closes any open connection/MCP overlay dialogs (resolving a pending `connect()` with `connection: undefined`) and clears the cached `_embeddingAuth` so a new `jwtToken` cannot reuse the previous user's exchanged token.
- **initialRoute**: `embedding.initialRoute` is passed through `VENDOR_INIT`; the client already honored it (`initialRoute ?? '/'`, where `/` means the role-based default route). Removed from the public API in 2024 (`b4d2060248`), re-exposed in SDK 0.12.0.
- Tests: `packages/ee/embed-sdk/test/index.test.ts` (vitest + jsdom, simulates the client half by dispatching `MessageEvent`s with controlled `source`/`origin`). Runs in root `test-unit`.

## Relationship with Managed Auth

Signing Keys are the cryptographic foundation for the Managed Auth flow:
1. Admin creates a signing key → receives private key.
2. Vendor stores the private key and uses it to sign JWTs with `kid` set to the key's `id`.
3. On `POST /v1/managed-authn/external-token`, `externalTokenExtractor` reads `kid` from the JWT header, fetches the public key via `signingKeyService.get`, and verifies the JWT using RS256.
