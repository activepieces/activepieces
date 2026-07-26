---
icon: 📡
---

# Gotcha: canary doesn't proxy websockets (only broadcasts reach canary users)

Canary is a **worker group that also has its own app tier** (`CANARY_APP_URL`, `IS_CANARY_APP`). The prod app is the ingress; `canaryRoutingMiddleware` HTTP-proxies a platform whose `workerGroupId === 'canary'` (`worker-group.service.ts` → `isCanaryPlatform`) to the canary app via `@fastify/reply-from`. **Only `/api/*` is proxied** — the middleware is registered inside the `/api` scope (`setupApp(apiApp)`), while the SPA is served at root from the baked-in bundle (`@fastify/static`, `Dockerfile` copies `dist/packages/web`). So a canary platform's browser runs the **prod** frontend and only its API calls reach canary. Canary shares prod's Postgres and Redis.

**The seam:** the middleware bails on websocket upgrades — `if (request.headers.upgrade === 'websocket') return`. So a canary platform's HTTP + flow jobs run on canary (new code), but its **websocket is terminated by prod (old code)**.

Across a version split (canary new, prod old):
- ✅ **Server→client broadcasts work.** socket.io uses `@socket.io/redis-adapter` on the shared Redis, so an `emit` from canary's `app.io` (table/flow deltas, chat chunks, AI-lock broadcasts, presence, step progress) propagates via Redis to the prod-held socket and is relayed **name-agnostically** to the new frontend.
- ❌ **Inbound handlers run on old prod code.** Socket lifecycle + client→server events (`LOCK_RESOURCE`/`UNLOCK_RESOURCE`, `JOIN/LEAVE_PRESENCE`) are handled by whoever terminates the socket = prod. New behavior (AI-lock `lockerKind`/`reason`/preemption in `lock.service`) does **not** run for canary users until prod promotes. Additive/optional contract so nothing crashes — it silently degrades.

**The fix (verified 2026-07): point canary-platform ws at the existing public canary host.** kamal-proxy can't help select canary (host/path routing only — **no cookie/header routing**), and `reply.from` is HTTP-only. But a distinct public canary deployment **already exists**: `canary.activepieces.com` — live, own newer bundle, valid cert, behind Cloudflare (ws passthrough proven by cloud's live realtime), `/api/socket.io` answering. So:
- Make the frontend socket URL a **runtime value** fetched from an authenticated `/api` flag (that call is proxied to canary → canary returns `wss://canary.activepieces.com`; prod returns same-origin), and defer socket creation until it resolves (`socket-provider.tsx` builds the socket at module load today).
- Cross-origin ws is fine: io server is `cors:{origin:'*'}` and auth is token-in-`socket.auth`, not cookies.
- **Bonus:** the socket is then terminated by the canary app, so inbound lock/presence handlers run on new code too — closes the FULL seam, not just broadcasts. Strictly better than same-host cookie/app-proxy approaches.
- Ops to confirm: `canary.activepieces.com` is pinned to the canary app across deploys (Cloudflare route / `config/app-canary.yml` host).

**Worker groups vs this:** worker groups route *jobs* (BullMQ queue per `workerGroupId`, `getPlatformGroupQueueName`); a ws/host fix is a browser-app-tier concern with zero effect on job routing. Canary is the **only** worker group with a separate app tier — dedicated worker groups share the prod app, so their users' ws already hits the correct code. Mirror gotcha: worker↔app sockets carry `workerGroupId` in post-upgrade auth, but workers use an explicit `socketUrl`, so canary workers must point at the canary app directly (config).

Source: analysis of PR #14219 (feat: chat core) canary/ws feasibility, 2026-07.
