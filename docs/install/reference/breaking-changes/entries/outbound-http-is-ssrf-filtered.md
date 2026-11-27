---
id: outbound-http-is-ssrf-filtered
title: "Outbound HTTP is SSRF-filtered"
added: '2026-04-07'
order: 3
release: 0.82.0
---

Server-side HTTP (OAuth, Vault, Conjur, event destinations, on-call pager, MCP validator) now blocks private, loopback, and cloud-metadata IPs. Reach internal hosts by adding their IP/CIDR to `AP_SSRF_ALLOW_LIST`.

#### What you need to do

If you self-host Vault, Conjur, an OAuth2 token endpoint, or any internal webhook on a private IP, set `AP_SSRF_ALLOW_LIST` (comma-separated IPs or CIDRs, e.g. `10.0.5.12,192.168.10.0/24`) before upgrading.
