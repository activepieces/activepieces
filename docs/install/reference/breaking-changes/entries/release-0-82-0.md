---
id: release-0-82-0
title: "0.82.0"
added: '2026-04-07'
release: 0.82.0
legacy: true
---

### What has changed?

#### Piece Versions Are Now Pinned
- Piece versions are no longer stored with wildcards (`~1.2.0`, `^1.2.0`). All piece steps now use exact versions (e.g. `1.2.0`).
- A migration automatically strips wildcard prefixes from all existing flow versions on upgrade.
- The `LOCK_AND_PUBLISH` operation no longer resolves piece versions at publish time — steps run with the exact version stored in the flow.
- A new **version switcher** UI in the builder lets users upgrade or downgrade piece versions manually.

#### REST API
- `ADD_ACTION`, `UPDATE_ACTION`, and `UPDATE_TRIGGER` now strip wildcard prefixes (`~`, `^`) from `pieceVersion` before saving. If you were relying on wildcard versions to auto-resolve on publish, your steps will now be pinned to the base version (e.g. `~1.2.0` becomes `1.2.0`).
- `LOCK_AND_PUBLISH` no longer modifies `pieceVersion` on any step. The version in the draft is the version that will run.
- A new endpoint `GET /v1/pieces/:name/versions` is available to list all versions of a piece, useful for building custom version selection.

#### Concurrent Jobs Env Var Renamed
- `AP_MAX_CONCURRENT_JOBS_PER_PROJECT` → `AP_DEFAULT_CONCURRENT_JOBS_LIMIT`. Default drops from `100` to `5`.

#### Outbound HTTP is SSRF-filtered
- Server-side HTTP (OAuth, Vault, Conjur, event destinations, on-call pager, MCP validator) now blocks private, loopback, and cloud-metadata IPs. Reach internal hosts by adding their IP/CIDR to `AP_SSRF_ALLOW_LIST`.

### Do you need to take action?
- **Pinned piece versions** — if you create or update flows via the REST API with wildcard versions (`~` or `^`), switch to exact versions; wildcards are silently stripped. If your publish flow relied on `LOCK_AND_PUBLISH` resolving wildcards, set the exact version on each step before publishing. Use `GET /v1/pieces/:name/versions` to list available versions.
- **Concurrent jobs** — rename `AP_MAX_CONCURRENT_JOBS_PER_PROJECT` to `AP_DEFAULT_CONCURRENT_JOBS_LIMIT`. To keep the old cap, set `AP_DEFAULT_CONCURRENT_JOBS_LIMIT=100`.
- **SSRF filter** — if you self-host Vault, Conjur, an OAuth2 token endpoint, or any internal webhook on a private IP, set `AP_SSRF_ALLOW_LIST` (comma-separated IPs or CIDRs, e.g. `10.0.5.12,192.168.10.0/24`) before upgrading.
