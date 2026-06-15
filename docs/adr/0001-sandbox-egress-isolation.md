---
status: accepted
---

# Sandbox egress isolation via a dedicated network namespace (Tier 3)

## Context

STRICT network mode (`AP_NETWORK_MODE=STRICT`) exists to stop untrusted user
flows/code running in the sandbox from reaching internal, private, loopback,
link-local, or cloud-metadata endpoints (SSRF), while still allowing approved
outbound HTTP.

isolate has a **binary** network model: `--share-net` gives the sandbox the
**entire host network**, and without it the sandbox gets an empty namespace that
can't even reach the host's `127.0.0.1` (so it can't reach the egress proxy or
the engine↔worker RPC socket). There is no veth/bridge middle ground in isolate
itself.

The current design (`4824ca6` and follow-ups) is forced by that trap into
sharing the whole host network and then **clawing it back in userland**: a
loopback egress proxy (`proxy.ts`), per-UID `iptables` REJECT rules
(`iptables-lockdown.ts`), DNS `/53` hole-punching, and reconciliation of two
disagreeing `resolv.conf` files (the hardcoded sandbox `8.8.8.8` asset vs. the
host resolver). Every production outage on this feature has lived in that
clawback layer, and all were environment coupling rather than happy-path logic
bugs:

- `79a0848` — axios sent absolute-URL `GET` to the proxy instead of `CONNECT`
- `ce92a8e` — iptables blocked DNS entirely
- `f58c816` — **2026-05-06 EAI_AGAIN**: host nameservers ≠ sandbox nameservers
- `c87c3ef` — STRICT→UNRESTRICTED settings drift left iptables armed

The clawback layer is also weaker than it looks: the in-engine `ssrf-guard`
only hooks Node's own `dns`/`net`, so native addons or non-Node code can bypass
it, and the iptables backstop depends on fragile, boot-time, environment-coupled
DNS hole-punching.

## Decision

Replace the userland clawback with **real network-namespace isolation, shipped
inside the Docker image (Tier 3a)**:

1. At worker boot in STRICT mode, the worker creates a restricted network
   namespace (`ap-egress`). A fresh netns has **loopback only, zero routes**.
2. A `veth` pair links `ap-egress` to the worker's main netns over a private
   `/30`. The worker hosts **both** the egress proxy **and** the engine↔worker
   RPC endpoint on the host-side veth IP. `ap-egress` is given a single route —
   to that peer IP — and **no default route and no NAT to the internet**.
3. isolate is launched inside that namespace
   (`ip netns exec ap-egress isolate --share-net …`), so it inherits the
   **restricted** namespace instead of the host's.
4. All in-sandbox name resolution goes through the proxy via `CONNECT host:443`
   (the proxy resolves); the sandbox never queries an upstream resolver. This
   folds in "Tier 2" and removes the `resolv.conf` machinery entirely.
5. **Hard condition:** the proxy's upstream connection is **pinned to the IP it
   validated** — resolve once, validate, dial that IP (custom dialer, or wrap the
   upstream socket with `request-filtering-agent` as the app-level `safeHttp`
   already does). Without this the proxy keeps its documented DNS-rebind TOCTOU
   (`proxy.ts:28-29`), which under Tier 3 becomes the *single* line of defense.

The sandbox's entire reachable universe becomes **one `/30` peer IP** hosting the
proxy + RPC. Egress restriction is now a **topological fact** (no route exists),
not a firewall rule that enumerates DNS holes and can drift on deploy.

This requires **no new customer action**: the same single flag
(`AP_NETWORK_MODE=STRICT`), the same capabilities STRICT already mandates
(`CAP_NET_ADMIN` + `CAP_SYS_ADMIN`, per `packages/server/worker/test/e2e/README.md`),
and stock `ip`/iproute2 primitives in the image.

## Considered options

- **Tier 1 — harden the current path** (fail loud on resolv.conf read miss,
  non-cwd path). Rejected: hardens the landmine without removing it; we'd own
  hand-rolled DNS reconciliation forever.
- **Tier 2 — proxy-resolved DNS only** (no sandbox DNS, iptables REJECTs all
  `:53`). Accepted *as a sub-step folded into Tier 3* — it closes the EAI_AGAIN
  class but keeps `--share-net` + per-UID iptables.
- **Tier 3a — in-container netns (chosen).** Closes the whole surface, ships in
  Docker, no new customer infra.
- **Tier 3b — platform/CNI egress (K8s NetworkPolicy / Cilium / egress
  gateway).** Rejected as the *baseline* because it pushes work to the customer's
  ops. Remains available as an optional enterprise posture layered on top.

## SSRF outcome

| Vector | Today | Tier 3a alone | Tier 3a + IP-pinning |
|---|---|---|---|
| Direct connect to private/metadata IP | iptables (fragile) | no route — blocked | no route — blocked |
| Bypass via native / non-Node code | weak (hooks miss it) | blocked (no route) | blocked |
| Private IP behind allowlisted host | proxy filter ✓ | proxy filter ✓ | proxy filter ✓ |
| DNS rebind (TOCTOU) | open | open | **closed** |
| Environmental drift (deploy outages) | recurring | gone | gone |

Tier 3 is only complete SSRF protection **with** the IP-pinning condition; the
pin is what turns "one unbypassable door" into "one door with no timing crack."

## Consequences

**Deleted:** the hardcoded `8.8.8.8` resolv.conf asset, the host+sandbox
nameserver union, the cwd-relative resolv.conf read, DNS `/53` hole-punching, and
the per-UID iptables clawback (a thin nft/iptables REJECT *inside* `ap-egress`
may be kept as defense-in-depth — see open questions).

**Changed:** the engine reaches the proxy and the worker RPC over the veth peer
IP, not `127.0.0.1` (inside `ap-egress`, `127.0.0.1` is the namespace's own
isolated loopback). The engine already reads `AP_EGRESS_PROXY_URL` and the RPC
endpoint from env, so this is an injected-address change, not a protocol change.

**New:** netns/veth lifecycle (create, address, route, teardown) with
crash-safe, idempotent cleanup on boot (mirror the existing iptables
`preflightCleanup` pattern).

**Caveat:** Tier 3a needs the ability to create nested netns
(`CAP_SYS_ADMIN`). A few hardened runtimes (gVisor-as-outer-runtime, strict Pod
Security Standards) forbid this even with the cap — but those same environments
already cannot run `isolate` + `iptables`, so STRICT never worked there; no
working environment is lost.

## Implementation plan

**Phase 0 — Spike / prereqs.** Confirm `ip`/iproute2 in the runtime image (add
to Dockerfile if missing). From inside the worker container, prove the topology:
create `ap-egress`, veth `/30`, single route, then
`ip netns exec ap-egress isolate --share-net … curl` reaches an allowlisted host
and fails closed to a private IP.

**Phase 1 — Proxy IP-pinning (independently shippable, do first).** Close the
DNS-rebind TOCTOU in `proxy.ts`: resolve once → validate → dial the validated IP
(or wrap the upstream socket with `request-filtering-agent`). Add a rebind test
(public at check time, private at connect time → blocked). Valuable on its own
and de-risks Tier 3.

**Phase 2 — Proxy-resolved DNS (Tier 2 mechanic).** Route all in-sandbox name
resolution through the proxy via `CONNECT`-by-hostname; stop the engine from
querying upstream resolvers in STRICT. Inventory pieces/libraries that resolve
DNS themselves or open raw non-HTTP TCP (see open questions).

**Phase 3 — Egress netns lifecycle.** New `egress/netns.ts`: create/destroy
`ap-egress`, veth pair, `/30` addressing, single route to the peer IP, no default
route/NAT. Bind the proxy and the worker RPC listener to the host-side veth IP.
Launch isolate via `ip netns exec ap-egress …`. Idempotent boot-time cleanup.

**Phase 4 — Remove the clawback layer.** Delete resolv.conf reconciliation, the
cwd-relative read, the `8.8.8.8` asset, and DNS hole-punching from
`iptables-lockdown.ts`/`lifecycle.ts`. Decide whether a minimal in-netns REJECT
stays as defense-in-depth.

**Phase 5 — Tests + rollout.** e2e: no route to `169.254.169.254`/private IPs;
allowlisted host reachable via proxy; rebind + metadata blocked. Retire/replace
the EAI_AGAIN regression test (the DNS path it guards no longer exists). Ship
behind the same `AP_NETWORK_MODE=STRICT` flag; canary on cloud.

## Open questions

1. **Shared vs per-box netns.** Start with one shared `ap-egress`; move to
   per-box only if cross-run isolation between concurrent sandboxes is required.
2. **Non-HTTP egress.** Proxy-only egress means only `CONNECT`-tunnelable traffic
   leaves (TLS/arbitrary TCP after the CONNECT handshake works; plain non-HTTP
   TCP from a non-proxy-aware client does not). Confirm no piece needs raw
   non-HTTP TCP to external hosts; if so, add per-destination netns routes or a
   TCP-CONNECT path.
3. **Defense-in-depth REJECT.** Keep a thin nft/iptables REJECT inside
   `ap-egress` as a belt-and-suspenders backstop to the routing, or rely on
   routing alone?
4. **DNS-self-resolving libraries.** Which pieces resolve DNS themselves rather
   than delegating to the proxy — decides how aggressive Phase 2 can be.
