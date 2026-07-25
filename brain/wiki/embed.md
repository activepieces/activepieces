---
icon: 🔌
---

# Embed

Embed Onboarding lets a platform admin configure embedded workflows via a stepper at `/platform/security/embed`. Cloud has 4 steps (register a Cloudflare custom hostname `embed_subdomain`, verify DNS, set `allowedEmbedDomains`, create signing keys); CE/EE has 2 (allowed domains + signing keys — self-hosted uses `FRONTEND_URL`). Whole feature gated by `platform.plan.embeddingEnabled`. Enterprise + Cloud only.

### Signing Keys (the crypto core)
- RSA-4096 key pairs generated server-side (Node `crypto.generateKeyPair`, PKCS#1 PEM) for the Managed Auth flow.
- On create, the **private key is returned exactly once** and must be saved by the admin; only the public key is persisted.
- `signing_key` entity: `platformId` (FK, RESTRICT), `displayName`, `publicKey` (PEM PKCS#1), `algorithm` (`KeyAlgorithm.RSA`, RS256 — only value supported).

### Endpoints (`/v1/signing-keys`, all platformAdminOnly)
- `POST` — generate pair, returns `AddSigningKeyResponse` (extends `SigningKey` with one-time `privateKey`); fires `SIGNING_KEY_CREATED` audit event.
- `GET` — list public keys (`SeekPage`, null cursors). `GET /:id` — single. `DELETE /:id`.
- Service `get({ id })` has **no platformId filter** — used by token extraction where only the `kid` is known.

### How it connects to Managed Auth
1. Admin creates a signing key → gets the private key once.
2. Vendor backend signs JWTs with `kid` = the key's `id`.
3. On `POST /v1/managed-authn/external-token`, `externalTokenExtractor` reads `kid`, fetches the public key via `signingKeyService.get`, verifies with RS256.

### Gotchas
- `allowedEmbedDomains` lives on the `platform` table (next to `allowedAuthDomains`), updated via `POST /v1/platforms/:id`. The `embed-security` Fastify hook reads it per request to set `Content-Security-Policy: frame-ancestors`.
- Private key is never stored; losing it means creating a new key.

### Key files
Entry point: `signingKeyModule`, registered twice in `packages/server/api/src/app/app.ts` (EE and Cloud editions).

- `packages/server/api/src/app/ee/signing-key/` — module, controller, service, RSA-4096 generator, TypeORM entity
- `packages/server/api/src/app/helper/embed-security.ts` — the `embedSecurity` hook that sets the frame-ancestors CSP per request
- `packages/core/shared/src/lib/ee/signing-key/` — `SigningKey` model, `KeyAlgorithm`, request and response schemas
- `packages/web/src/app/routes/platform/security/embed/` — admin Embed Onboarding stepper UI
- `packages/web/src/features/platform-admin/api/signing-key-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/signing-key-hooks.ts` — React query hooks
- `packages/web/src/features/platform-admin/components/new-signing-key-dialog.tsx` — dialog that shows the private key once on creation

Paths verified 2026-07-17.
