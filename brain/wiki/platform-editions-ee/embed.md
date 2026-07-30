---
icon: 🔌
---

# Embed

Running the Activepieces builder inside someone else's SaaS: a signed JWT provisions the user, an iframe hosts the builder, and a per-request CSP decides who is allowed to frame it. Enterprise + Cloud only — both modules gate on `platform.plan.embeddingEnabled`.

The integration steps a customer follows (SDK script, `activepieces.configure(...)`, piece customization, predefined connections) are public and live at [docs/embedding](https://www.activepieces.com/docs/embedding). This page is the parts that are not public: what the server actually does, plus the SDK↔client handshake the docs treat as a black box.

### 🔑 Signing Key
An RSA-4096 keypair generated server-side (`crypto.generateKeyPair`, PKCS#1 PEM both halves). The **private key is returned exactly once** on create and never stored — lose it and you create a new key. Only the public key is persisted.
- `signing_key` entity: `platformId` (FK, RESTRICT), `displayName`, `publicKey`, `algorithm` (`KeyAlgorithm.RSA` → RS256, the only supported value).
- `signingKeyService.get({ id })` deliberately has **no `platformId` filter** — token extraction knows only the `kid`, not yet which platform it belongs to.

### 🎫 External token
The vendor's backend signs a JWT with `kid` = the signing key's id. `POST /v1/managed-authn/external-token` reads that `kid` (`external-token-extractor.ts`), fetches the public key, and verifies RS256. The token identifies a user + project; an existing pair is logged in rather than recreated. See [Managed Auth](../connections-auth/managed-auth.md).

### 🌐 Embed Subdomain
A Cloud-only custom hostname registered with Cloudflare so the embed is served from the customer's own domain. `cloudflareService.createCustomHostname` returns the DNS verification records the admin must publish.
- *Avoid:* "custom domain" — that is a separate platform feature; this one exists only to host the embed iframe.

### 🛡️ Allowed embed origins
The list that becomes `Content-Security-Policy: frame-ancestors`. Two sources, merged and de-duplicated per request:
1. `platform.allowedEmbedOrigins` — set via `POST /v1/embed-subdomain/allowed-embed-origins`
2. `AP_ALLOWED_EMBED_ORIGINS` — the env list (`AppSystemProp.ALLOWED_EMBED_ORIGINS`)

Each entry must be a bare origin — validated by `new URL(v).origin === v`, so a value with a path or trailing slash is silently dropped.
- *Avoid:* `allowedEmbedDomains` — the old field name, gone. It is `allowedEmbedOrigins`, and it holds origins, not domains.

## Embed SDK handshake

`ActivepiecesEmbedded` (`packages/ee/embed-sdk`, bundled to `https://cdn.activepieces.com/sdk/embed/<version>.js`) drives the vendor↔client postMessage sequence: SDK appends the iframe → client posts `CLIENT_INIT` → SDK posts `VENDOR_INIT` (jwt, initialRoute, flags) → client exchanges the token via `POST /v1/managed-authn/external-token`, registers its `VENDOR_ROUTE_CHANGED` listener, then posts `CLIENT_CONFIGURATION_FINISHED`.

- **`navigate()` before configuration finishes is deferred, not dropped.** The client's route listener is not registered yet, so the call would vanish. The latest route is held in `_pendingRoute` (last-wins, so it cannot grow) and applied once configuration finishes — race-free because the client registers the listener *before* posting that event. Deferral logs a `warn`; with no `embedding.containerId` configured it logs an error instead, since no iframe will ever exist.
- **`configure()` tears down the previous embed before building a new one.** The cleanup closure (`_cleanDashboardIframe`) is armed *before* the container poll starts, so a `configure()` superseded mid-poll is cancelled rather than leaving a second iframe. Every dashboard `message` listener shares one `AbortSignal`; cleanup aborts it, removes the iframe, and resolves the superseded `configure()` with `{ status: 'superseded' }`. It also closes any open connection/MCP overlay dialog (resolving a pending `connect()` with `connection: undefined`) and clears the cached `_embeddingAuth`, so a new `jwtToken` cannot reuse the previous user's exchanged token.
- **`initialRoute`** rides `VENDOR_INIT`; the client already honored it (`initialRoute ?? '/'`, where `/` means the role-based default). It was removed from the public API in 2024 (`b4d2060248`) and re-exposed in SDK 0.14.0.

## How the CSP is resolved

`embedSecurity(log).getFrameAncestorsHeader({ hostname })` in `helper/embed-security.ts` runs per request, behind an LRU (1000 entries, 3-minute TTL):

- **Cloud** — cache key is the request hostname. `embedSubdomainService.getByHostname` maps it to a platform; no match means env origins only.
- **Self-hosted** — one cache key (`__self_hosted__`), platform resolved via `platformService.getOldestPlatform()`.
- **On any error** — logs a warn and returns the env origins alone. It degrades to *more* restrictive, never open.
- **Empty list** — emits `frame-ancestors 'self'`, which blocks all third-party framing.

That 3-minute TTL is the reason a freshly-added origin does not take effect immediately.

## Admin UI

The Embed Onboarding stepper at `/platform/security/embed`. Four steps exist as files — `hostname-step`, `dns-step`, `allowed-domains-step`, `signing-keys-step` — and Cloud walks all four; self-hosted skips the two Cloudflare ones because it serves the embed from `FRONTEND_URL`.

## Endpoints

| Route | Purpose |
|---|---|
| `POST /v1/signing-keys` | generate a pair; returns `AddSigningKeyResponse` with the one-time `privateKey`; fires `SIGNING_KEY_CREATED` |
| `GET /v1/signing-keys`, `GET/DELETE /v1/signing-keys/:id` | list public keys (`SeekPage`, null cursors), fetch, delete |
| `POST /v1/embed-subdomain` | register/update the Cloudflare custom hostname |
| `GET /v1/embed-subdomain` | current subdomain + verification status |
| `POST /v1/embed-subdomain/allowed-embed-origins` | set `platform.allowedEmbedOrigins` |

## Key Files

- `packages/server/api/src/app/ee/signing-key/` — module, controller, service, RSA-4096 generator, entity
- `packages/server/api/src/app/ee/embed-subdomain/` — module, controller, service, entity, `cloudflare.service.ts`
- `packages/server/api/src/app/helper/embed-security.ts` — the frame-ancestors resolver and its LRU
- `packages/server/api/src/app/ee/managed-authn/lib/external-token-extractor.ts` — `kid` → public key → RS256 verify
- `packages/core/shared/src/lib/ee/signing-key/` — `SigningKey`, `KeyAlgorithm`, request/response schemas
- `packages/core/shared/src/lib/management/platform/` — `allowedEmbedOrigins` on the platform model and requests
- `packages/web/src/app/routes/platform/security/embed/` — the stepper and its four steps
- `packages/web/src/features/platform-admin/` — `signing-key-api`, `embed-subdomain-api`, hooks, and the dialog that shows the private key once
- `packages/ee/embed-sdk/src/index.ts` — `ActivepiecesEmbedded`: the handshake, route deferral, and reconfigure teardown
- `packages/ee/embed-sdk/test/index.test.ts` — vitest + jsdom, simulates the client half by dispatching `MessageEvent`s with controlled `source`/`origin`; runs in root `test-unit`
- `packages/web/src/app/routes/embed/index.tsx` — the client half of the handshake

Both modules are registered twice in `app.ts` — once for EE, once for Cloud.

Verified against code 2026-07-26.
