# Network Security (SSRF)

## Summary
Outbound network/SSRF protection has **two in-process layers** and no application-level egress enforcement. The hard egress boundary for untrusted sandboxed code lives in **infrastructure** (e.g. the Cloud VPC firewall blocking the metadata IP `169.254.169.254` and RFC1918 ranges), not in this codebase.

The former out-of-process layer — a `proxy-chain` egress proxy plus kernel `iptables` lockdown, gated on `AP_NETWORK_MODE=STRICT` — was removed: it was the source of recurring incidents (resolv.conf nameserver reconciliation → EAI_AGAIN, HTTPS CONNECT tunnelling breakage, orphan-engine/OOM interactions) and only ran on Cloud, where the VPC firewall already enforces egress independently.

## Layers
1. **Server-side `safeHttp`** (`packages/server/utils/src/safe-http.ts`) — wraps `request-filtering-agent` so the API/worker's **own** outbound calls (OAuth refresh, secret managers, MCP validation) reject private/loopback/link-local/metadata IPs. Always on; independent of `NETWORK_MODE`. This never guarded the sandbox.
2. **Engine `ssrf-guard`** (`packages/server/engine/src/lib/network/`) — installed inside the sandbox when `AP_NETWORK_MODE=STRICT`. Two self-contained JS monkeypatches:
   - `dns-lookup-guard.ts` — resolves all A/AAAA records and rejects if any is a blocked IP.
   - `socket-connect-guard.ts` — rejects raw-IP connects to blocked IPs (exempts the loopback engine↔worker RPC port from `AP_SANDBOX_WS_PORT`).

## Threat model — read this
The engine `ssrf-guard` is **best-effort only**. It stops *accidental* SSRF (a piece naively fetching a user-supplied internal URL) but is **NOT a boundary against malicious code**: `worker_threads`, `process.binding('tcp_wrap')`, and native addons sidestep the JS monkeypatches. Do not treat `STRICT` as a wall. The only hard boundary against hostile sandboxed code is the infrastructure egress firewall.

## Key Files
- `packages/server/utils/src/safe-http.ts` — server-side filtered axios/agents
- `packages/server/engine/src/lib/network/ssrf-guard.ts` — install/uninstall + policy
- `packages/server/engine/src/lib/network/dns-lookup-guard.ts`, `socket-connect-guard.ts` — the two guards
- `packages/core/utils/src/lib/ssrf-ip-classifier.ts` — shared `isBlockedIp({ ip, allowList })`
- `packages/server/worker/src/lib/execute/create-sandbox-for-job.ts` — sets `AP_NETWORK_MODE` (mirrors `settings.NETWORK_MODE`) + `AP_SSRF_ALLOW_LIST` in the sandbox env

## Edition Availability
- Community (CE) / Enterprise (EE): `AP_NETWORK_MODE` defaults to `UNRESTRICTED` (guards off). Self-hosters may set `STRICT` for the best-effort in-process guards.
- Cloud: hard egress boundary is the VPC firewall. `NETWORK_MODE` (STRICT for the extra in-process guards, or UNRESTRICTED) is a single system-property flip.

## Domain Terms
- **`AP_NETWORK_MODE`** — `UNRESTRICTED` (no engine guards) vs `STRICT` (engine dns + socket guards active). No longer starts a proxy or firewall.
- **`AP_SSRF_ALLOW_LIST`** — comma-separated IPs/CIDRs that bypass the `ssrfIpClassifier` block (used by both `safeHttp` and the engine guards).
- **`AP_SANDBOX_WS_PORT`** — loopback port for engine↔worker RPC; exempted from the socket guard.
