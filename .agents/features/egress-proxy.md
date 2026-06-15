# Egress Proxy Module

## Summary
HTTP proxy that every piece/code step is routed through when `AP_NETWORK_MODE=STRICT`. Provides SSRF protection by validating each request's resolved IPs against an allow-list before letting `proxy-chain` tunnel the traffic. In isolate modes the sandbox runs inside a dedicated restricted network namespace (`ap-egress`) whose only route is a `/30` veth link to the worker — so the sandbox has no egress path except the proxy, enforced by routing (no iptables, no DNS holes). The proxy binds to the gateway veth IP `10.255.0.1:<random port>` (in non-strict/test paths it falls back to `127.0.0.1`); started from `startEgressProxy()` in `packages/server/worker/src/lib/egress/proxy.ts`.

## Key Files
- `packages/server/worker/src/lib/egress/proxy.ts` — `proxy-chain` server (optional `host` bind) + `prepareRequestFunction` allow-list check
- `packages/server/worker/src/lib/egress/lifecycle.ts` — `startEgressStack()` / `shutdownStack()`, wiring netns + proxy on the gateway IP
- `packages/server/worker/src/lib/egress/netns.ts` — creates/destroys the `ap-egress` network namespace and `/30` veth pair (idempotent preflight cleanup)
- `packages/server/worker/src/lib/sandbox/isolate.ts` — wraps the sandbox spawn with `ip netns exec ap-egress … isolate --share-net` in STRICT
- `packages/server/worker/src/lib/execute/create-sandbox-for-job.ts` — injects `AP_EGRESS_PROXY_URL` (gateway IP) + `AP_SANDBOX_WS_HOST` into each sandbox env (`proxyEnv()` / `baseEnv()`)
- `packages/server/engine/src/lib/network/ssrf-guard.ts` — engine-side guard install (DNS + socket-connect + env-proxy-dispatcher)
- `packages/server/engine/src/lib/network/proxy-dispatcher.ts` — installs undici `EnvHttpProxyAgent` for native `fetch`
- `packages/pieces/common/src/lib/http/axios/axios-http-client.ts` — piece-side `AxiosHttpClient` that wires `HttpProxyAgent` / `HttpsProxyAgent` and sets `config.proxy = false`

## Edition Availability
- Community (CE): available, off by default (`AP_NETWORK_MODE=UNRESTRICTED`)
- Enterprise (EE): same as CE
- Cloud: enabled with `AP_NETWORK_MODE=STRICT`; API host auto-added to the allow-list via `maybeStartProxyAllowingApiHost()`

## Domain Terms
- **`NETWORK_MODE`** — `UNRESTRICTED` (no proxy, no netns) vs `STRICT` (netns + proxy on the gateway IP in isolate modes)
- **`AP_SSRF_ALLOW_LIST`** — comma-separated IPs/CIDRs that bypass the egress `ssrfIpClassifier` block
- **`prepareRequestFunction`** — `proxy-chain` hook that runs before each tunnel/HTTP request; Activepieces uses it to resolve all A/AAAA records for the hostname and reject if any resolved IP is blocked
- **`ap-egress` netns** — restricted network namespace containing only a `/30` veth link to the worker (gateway `10.255.0.1`); the sandbox runs inside via `ip netns exec ap-egress isolate --share-net`, so its only reachable destination is the gateway (proxy + WS-RPC) — egress is blocked by routing, not a firewall
- **`AP_SANDBOX_WS_HOST`** — gateway IP the engine connects to for worker RPC in STRICT (inside the netns `127.0.0.1` is the namespace's own loopback); defaults to `127.0.0.1` in UNRESTRICTED

## Request Flow (STRICT mode)
1. Worker boots → `startEgressStack()` creates the `ap-egress` netns + `/30` veth and starts the proxy bound to the gateway IP `10.255.0.1:<proxyPort>`.
2. For each sandbox, `create-sandbox-for-job.ts` injects `AP_EGRESS_PROXY_URL=http://10.255.0.1:<proxyPort>` and `AP_SANDBOX_WS_HOST=10.255.0.1`; `isolate.ts` launches the sandbox via `ip netns exec ap-egress … isolate --share-net`, so it inherits the restricted namespace.
3. Piece's HTTP client sends traffic to the proxy; for HTTPS it must issue `CONNECT host:443` (the proxy is an HTTP proxy, not a TLS-terminating one). The sandbox has no other route — direct connections to the internet/private/metadata fail with `ENETUNREACH`.
4. `prepareRequestFunction` resolves the hostname, checks every IP against `ssrfIpClassifier`, and either allows the tunnel or throws `Egress blocked: <host>` (403).
5. `proxy-chain` establishes the upstream TCP connection via `direct()` and streams bytes both ways.

## Regression Note: HTTPS fails with `Only HTTP protocol is supported (was https:)`

### Symptom
In STRICT mode, any piece that doesn't ship the post-PR-#12700 `AxiosHttpClient` fails on HTTPS targets (e.g. HTTP piece v0.4.5 calling any `https://…` third-party API) with:

```json
{ "response": { "status": 400, "body": "Only HTTP protocol is supported (was https:)" }, "request": {} }
```

Thrown by `proxy-chain` at `server.js:391` when it receives a non-`CONNECT` request whose target is an absolute `https://…` URL.

### Root cause
PR #12700 (egress proxy) sets the standard `HTTP_PROXY` / `HTTPS_PROXY` / `http_proxy` / `https_proxy` env vars inside every sandbox (`create-sandbox-for-job.ts:112–124`). In the same PR, `AxiosHttpClient` was patched to read those vars, build `HttpProxyAgent` / `HttpsProxyAgent`, and set `config.proxy = false`. That patched client tunnels correctly (`CONNECT` → 200).

However, **pieces are not loaded from the monorepo** at runtime — the worker installs each piece from npm into `cache/v11/common/pieces/…/node_modules` (`piece-installer.ts:98–101`, `cache-paths.ts:14`) and mounts that read-only into the isolate sandbox. Published pieces pin older `pieces-common`:
- `@activepieces/piece-http@0.4.5` → `@activepieces/pieces-common@0.2.15`
- `@activepieces/piece-zerobounce@latest` → `@activepieces/pieces-common@0.11.6`

Neither ships the agent wiring. With no custom agents and `config.proxy` undefined, axios falls back to its built-in `proxy-from-env` path (`axios/lib/adapters/http.js:192–233`) which rewrites the request to the proxy host and emits `GET https://<target-host>/… HTTP/1.1` — no `CONNECT`. `proxy-chain` rejects with the 400.

Reproduced locally:
- Old-style axios + env vars → exact 400 error.
- New `AxiosHttpClient` (agents + `proxy: false`) → 200.
- Proposed fix (global `http`/`https.globalAgent`, no `HTTP_PROXY` env vars) + old-style axios → 200.

### Fix direction
Do the proxy wiring at the engine level, not via standard env vars:
1. Pass the proxy URL as `AP_EGRESS_PROXY_URL` from `create-sandbox-for-job.ts` instead of `HTTP_PROXY` / `HTTPS_PROXY`.
2. In the engine's `ssrf-guard` bootstrap, set `http.globalAgent = new HttpProxyAgent(url)` and `https.globalAgent = new HttpsProxyAgent(url)` so any axios/http caller without an explicit agent still tunnels via `CONNECT`.
3. Replace the undici `EnvHttpProxyAgent` dispatcher with `new ProxyAgent(AP_EGRESS_PROXY_URL)` to keep `fetch` proxied after removing the standard env vars.

This covers every already-published piece (including third-party ones) without needing a mass republish of pieces-common consumers.
