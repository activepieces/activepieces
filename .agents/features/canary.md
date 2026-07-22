# Canary Routing

## Summary
Canary is a **worker group that also has its own app tier** (`CANARY_APP_URL`, `IS_CANARY_APP`). A platform whose `platform_plan.workerGroupId === 'canary'` (`workerGroupService.isCanaryPlatform`) has its flow jobs routed to a dedicated queue **and** its HTTP/websocket traffic served by a separate canary deployment of the app — so a subset of real platforms exercises a new release before it is promoted to production. The prod app is the ingress and reverse-proxies canary platforms to the canary app; canary and prod **share the same Postgres and Redis**.

This module makes the canary experience **transparent on the primary origin** (`cloud.activepieces.com`): a canary platform gets the new frontend + backend + websockets on the normal URL, so all auth/OAuth/SSO keep working (redirecting to a `canary.*` origin would break them — the session token is origin-scoped `localStorage`, and OAuth `redirect_uri`s are registered for the primary origin only).

## How routing works
All routing keys off one cookie, `ap_canary`, minted by the backend once an authenticated `/api` request confirms a canary platform.

1. **`/api` (principal-based)** — `canary-routing.middleware.ts` (preHandler in the `/api` scope): resolves the platform from the principal (or the flow cache for webhooks), and if canary, reverse-proxies to `CANARY_APP_URL` **and** sets the `ap_canary` cookie. On the authoritative non-canary path it clears a stale cookie.
2. **Static / SPA (cookie-based)** — `canary-static-routing.middleware.ts` (root `onRequest`): for the frontend surface (everything except `/api`, `/mcp`, `/ingest`, `/.well-known`, and ws upgrades), if the signed cookie validates, reverse-proxies to canary so the **canary bundle is served on the primary origin**.
3. **Websocket (cookie-based)** — `canary-ws-routing.ts`: wraps the HTTP server `upgrade` event; a valid-cookie `/api/socket.io` upgrade is piped to canary (transparent passthrough via Node `http`/`https` — no frame parsing, so no `ws` dependency), everything else is delegated to socket.io's own captured upgrade listeners. This makes a canary user's socket terminate on **canary** code, so inbound handlers (locks, presence) run on the new version too — not just server→client broadcasts.
4. **Bundle swap** — `main.tsx`: once the cookie is present, the frontend reloads **once** (guarded by `reloadOnceForStaleChunk`) so the reload request carries the cookie and the canary bundle is served in place of the prod one. The canary bundle also sees the cookie but skips on the session guard, so there is no loop.

`reply.from` (`@fastify/reply-from`) is registered **once at the root** (`server.ts`) and shared by both the `/api` and static middlewares — it is `fastify-plugin`-wrapped, so registering it in both root and the `/api` scope would collide.

## Security model
- The `ap_canary` cookie is **HMAC-signed** with the JWT secret (via `@fastify/cookie`, registered at the root) so a client cannot forge one the server accepts.
- It is **deliberately not HttpOnly** — the frontend reads its presence to trigger the one-time bundle swap. This is safe: the cookie carries **no privilege** (auth stays the token; the cookie only selects which code version serves), and signing prevents forgery. XSS reading a routing flag is harmless; XSS setting one fails signature verification.
- `Secure`, `SameSite=Lax`, host-only, 1-day max-age.
- **CDN contamination guard**: `index.html` is served `Cache-Control: no-store` + `Vary: Cookie` (a shared/CDN cache must never serve a canary `index.html` to a prod user, since it is an un-hashed shared URL). Hashed `/assets/*` stay `immutable` — unique filenames per build, safe to cache.
- **No SSRF**: the proxy upstream is always the fixed `CANARY_APP_URL` (admin config), never user input.
- All new paths are **no-ops when `CANARY_APP_URL` is unset** (self-hosted / CE default).

## Key files
| Concern | File |
| --- | --- |
| Cookie mint/clear/verify (delegates to `@fastify/cookie`) | `core/canary/canary-cookie.ts` |
| `/api` principal-based proxy + cookie set/clear | `core/canary/canary-routing.middleware.ts` |
| Static/SPA cookie-based proxy | `core/canary/canary-static-routing.middleware.ts` |
| Websocket upgrade cookie-based proxy | `core/canary/canary-ws-routing.ts` |
| Root wiring (cookie plugin, reply-from, hooks) | `app/server.ts` |
| Canary worker group / `isCanaryPlatform` | `ee/platform/platform-plan/worker-group.service.ts` |
| Frontend one-time bundle swap | `packages/web/src/main.tsx` |

## Ops prerequisites
- **Cloudflare**: bypass cache when the `ap_canary` cookie is present (belt-and-suspenders with the `no-store` header on `index.html`).
- The **canary app must NOT set `CANARY_APP_URL`** (otherwise it proxies to itself — loop).
- Keep the canary hostname/service pinned to the canary deployment.
- Transparent primary-origin routing only takes effect **once this ships to prod** — the reload logic must live in the bundle users first load. Until then, canary is reached directly via `canary.activepieces.com`.
