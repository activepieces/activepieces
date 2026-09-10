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
- **`VENDOR_INIT` is flat.** Nested `configure()` groups are flattened onto the message (`styling.fontUrl` → `fontUrl`, `analytics.gtmContainerId` → `gtmContainerId`), so adding a param means touching the SDK type, the `VENDOR_INIT` payload, `EmbeddingState`, and the `routes/embed` init in step. The client-side loaders (`embedding-font-loader.tsx`, `embedding-analytics-loader.tsx`) read from `EmbeddingState`, never from the message.
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

## Gotchas

- **The iframe's `<head>` is static.** `/embed` serves the same built `index.html` as the main app; `vite-plugins/html-plugin.js` substitutes only `apTitle`/`apFavicon` at build time. Anything a vendor wants inside the iframe (fonts, tracking tags) has to be appended to `document.head` at runtime from `VENDOR_INIT` data — `embedding-font-loader.tsx` is the precedent.
- **No `script-src` in the CSP.** `embed-security.ts` emits only `frame-ancestors`, so third-party scripts loaded inside the embed (GTM, Clarity) are not blocked by policy. See GIT-1746 / GitHub #14796.
- **PostHog is off in the embed** (`telemetry-provider.tsx` bails when `isEmbedded` or the path starts with `/embed`), so embed customers have no in-iframe analytics unless they bring their own.
- **An SDK version bump must also land in `bun.lock`.** The workspace entry for `packages/ee/embed-sdk` records `"version"`, so bumping `package.json` alone makes `bun install --frozen-lockfile` (the Docker image build) fail with `lockfile had changes, but lockfile is frozen`. Edit the one `version` line in `bun.lock` (or run `bun install`) in the same commit.
- **Testing embedding on a local EE box with no license key.** Fresh EE lands on `AUTUMN_FREE_PLAN` (`embeddingEnabled: false`) and `ensureEnrolled` would create a real Autumn customer on the production console, then overwrite the flags every 15 min. Set `AP_AUTUMN_CONSOLE_URL=http://console.invalid` so enrollment fails safe (existing flags stand, retried every 300s with a warn), then `UPDATE platform_plan SET "embeddingEnabled" = true;`. Add the vendor page origin to `AP_ALLOWED_EMBED_ORIGINS`, mint a signing key via `POST /v1/signing-keys`, and sign the JWT inside the app container (`docker exec … node -e` has `jsonwebtoken`). Verified 2026-09-10 on the 0.90.4 image.
- **Clarity's tag is not self-contained.** `https://www.clarity.ms/tag/<projectId>` returns 200 for a valid project but is a 700-byte loader that calls `window.clarity(...)` synchronously and expects the official snippet's queue stub (`c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}`) to exist already. Append only the `<script>` and it dies with `TypeError: Cannot read properties of undefined (reading 'v')`, never loads `scripts.clarity.ms/…/clarity.js`, and Clarity stays on "Almost there" forever while the tag request looks healthy. `embedding-analytics-loader.tsx` installs the stub first; an unknown project id returns 204, not an error. Verified 2026-09-10.
- **Embed analytics ids (`embedding.analytics.gtmContainerId` / `clarityProjectId`, SDK 0.16.0) are vendor-code config, not a platform column, on purpose.** They ride `VENDOR_INIT` like fonts and hidden-UI flags, so there is no admin field, migration, or endpoint. GitHub #14796 / GIT-1746 left both options open; the SDK path was picked as the smaller change. If a customer insists on setting them in Platform Settings, that is the additive follow-up, not a redo.
- **"GTM does nothing" in the embed usually means an empty or unpublished container, not a loader bug.** `gtm.js?id=…` is ~330 KB even for a container with zero tags, so size proves nothing. Verify in three steps: inside the iframe `window.google_tag_manager['GTM-…']` exists and `dataLayer` shows `gtm.js` → `gtm.dom` → `gtm.load` (GTM booted); then fetch the same `gtm.js` and parse the `var data = {…};` blob — `resource.tags` / `resource.rules` empty means nothing can fire; GTM serves only the published Live version, so workspace edits change nothing until Submit. Verified 2026-09-10 against `GTM-5KZNZGMN` (version 1, 0 tags).
- **Third-party tag failures surface as `Script error.` with no stack.** A cross-origin script (GTM tag, Clarity) that throws reaches `window.onerror` with `event.error == null` and the message `Script error.`; nothing in it is actionable. We deliberately left frontend error reporting untouched (2026-09-10: a global or embed-scoped filter was tried on #15442 and reverted to keep the change contained), so a vendor's broken tag shows up in Sentry as that opaque message. A tag script that fails to *load* removes its own `<script>` element and warns, so `isScriptLoaded` does not mistake a dead element for a loaded one.
- **`VENDOR_INIT` trusts `event.source`, not `event.origin`.** The client accepts the message from `window.opener ?? window.parent`; the real trust gate is the external-token exchange succeeding. Gate anything sensitive (script injection, storage) on that `onSuccess`, not on receipt of `VENDOR_INIT`.

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
