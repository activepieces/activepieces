# Sandbox + SSRF Integration Tests

These tests exercise the three SSRF hardening layers against real Linux primitives:

- **Egress proxy** — HTTP/CONNECT forward proxy with IP allowlist (`src/lib/egress/proxy.ts`)
- **iptables lockdown** — kernel OUTPUT chain that REJECTs sandbox UIDs except the proxy port (`src/lib/egress/iptables-lockdown.ts`)
- **Engine SSRF guard** — Node.js `dns.lookup` + `Socket.connect` + undici hooks (`engine/src/lib/ssrf/ssrf-guard.ts`)

They require `iptables`, the `isolate` binary, and `CAP_NET_ADMIN` / `CAP_SYS_ADMIN` — none of which are available on macOS. Run them through the provided Docker harness.

## Usage

From the repo root on any Docker host:

```bash
npm run test:sandbox-e2e
```

This builds a privileged container and runs the vitest suite inside it. See `Dockerfile` for the image definition and `scripts/run-sandbox-e2e.sh` for the wrapper.

If the suite is invoked directly on a host that lacks the required primitives it will skip with a clear message — it does not silently pass.

## Real third-party connectivity smoke

`sandbox-real-third-party.e2e.test.ts` brings up the same SANDBOX_PROCESS + STRICT stack used in production and reaches out to a curated list of public APIs (~30 hosts: OpenAI, Anthropic, Stripe, GitHub, Notion, etc.). It asserts:

- DNS resolves (no `EAI_AGAIN` — the production-outage signature).
- HTTPS via CONNECT through the egress proxy reaches the real origin (any HTTP status is accepted; we only assert the connection landed).
- AWS/GCP metadata endpoints and RFC1918 / loopback IPs remain blocked.

Tolerance: requires ≥80% of Group A hosts to succeed (one transient vendor outage shouldn't fail CI; a systemic break in DNS/proxy/iptables takes the whole list down). Auto-skips when no outbound internet (TCP/443 to `1.1.1.1` is unreachable).

## Why these exist alongside the unit tests

The unit tests under `packages/server/worker/test/lib/egress/` and `packages/server/engine/test/ssrf/` mock `execFile`, `spawn`, and kernel state. They prove the logic branches, not that the kernel is actually enforcing anything. These e2e tests close that gap.
