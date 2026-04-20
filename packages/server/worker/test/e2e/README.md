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

## Why these exist alongside the unit tests

The unit tests under `packages/server/worker/test/lib/egress/` and `packages/server/engine/test/ssrf/` mock `execFile`, `spawn`, and kernel state. They prove the logic branches, not that the kernel is actually enforcing anything. These e2e tests close that gap.
