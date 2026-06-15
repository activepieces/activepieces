# Activepieces

Glossary of project-specific domain language. General programming concepts do not belong here.

## Sandbox network isolation

**Network mode**:
Per-deployment egress posture, `AP_NETWORK_MODE` ∈ {`UNRESTRICTED` (default), `STRICT`}. STRICT restricts sandbox egress to prevent SSRF; UNRESTRICTED disables all egress restriction machinery.
_Avoid_: "secure mode", "locked-down mode".

**Egress proxy**:
The forward proxy (loopback / veth-hosted) that all approved outbound sandbox HTTP must traverse in STRICT mode. It resolves destination hostnames and enforces the SSRF allowlist. The single SSRF policy decision point.
_Avoid_: "gateway", "forward proxy" (in code/docs use "egress proxy").

**Egress netns** (`ap-egress`):
The dedicated network namespace a sandbox runs in (Tier 3, see ADR-0001). Its only route is to the worker's veth peer IP hosting the egress proxy + RPC; no default route, no NAT. Egress restriction is a routing fact, not a firewall rule.
_Avoid_: "sandbox network", "jail".

**Kernel lockdown**:
The legacy (pre-Tier-3) per-UID `iptables`/`ip6tables` REJECT chain that claws back egress after `isolate --share-net` exposes the whole host network. Being retired by ADR-0001.
_Avoid_: "firewall rules", "iptables rules" (name the mechanism: kernel lockdown).

**SSRF allowlist**:
The set of destination IPs/CIDRs the egress proxy permits (`AP_SSRF_ALLOW_LIST` plus the resolved API host). Distinct from DNS resolver reachability — it does **not** open DNS holes.
_Avoid_: "whitelist", "safe list".
