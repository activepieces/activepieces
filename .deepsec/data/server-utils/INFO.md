# server-utils

## What this codebase does

Shared backend utilities for `server-api` and `server-worker`. Pure
TypeScript library: logger, error helpers, S3/file-store wrappers, OIDC
helpers, and — most importantly — `safeHttp`, the SSRF-filtered axios
factory that every outbound HTTP call in the backend is required to use.
No DB access, no Fastify routes.

## Auth shape

This package has no auth surface of its own. It does host helpers used by
the auth path in `server-api`: cryptographic primitives, OIDC discovery,
and JWT helpers. A bug here is a bug everywhere those primitives are
imported, so blast radius is high.

## Threat model

`safeHttp` is the single point of failure for the entire backend's SSRF
posture. A regression that lets it accept private/loopback/metadata IPs
(via DNS rebinding, a missing `lookup` override, or a custom `httpAgent`
that bypasses `request-filtering-agent`) is a critical bug. Similarly,
helpers that derive `Authorization` headers, sign URLs, or hash secrets
have outsized impact relative to their LOC.

## Project-specific patterns to flag

- **A `safeHttp`-adjacent helper that drops the SSRF filter.** Anything
  exported from this package that returns an `axios` instance, an
  `http.Agent`, or a `fetch` wrapper MUST route through
  `request-filtering-agent`. A new HTTP helper that does its own
  `axios.create({ httpAgent: new http.Agent(...) })` without the filter
  is a regression.
- **DNS lookup overrides.** Any code that passes a custom `lookup`
  function to `http.request` / `axios` / `node:net` must defer to the
  `request-filtering-agent` lookup. A `dns.lookup` shortcut would re-open
  the TOCTOU window the filter closes.
- **Crypto with non-constant-time compare on a secret.** String `===` on
  HMACs, signatures, or tokens — use `crypto.timingSafeEqual`.
- **JWT helpers that accept `alg: "none"` or skip signature verification.**
  `jsonwebtoken`/`jose` defaults are usually safe; an explicit
  `algorithms: ['none']` or a `verify(...)` call missing the algorithm
  whitelist is a finding.
- **Logger calls that take a raw `Error.stack`, `req.headers`, or
  `req.body` object.** The shared logger is used everywhere; an
  unredacted header dump prints `Authorization` tokens.

## Known false-positives

- `safeHttp` itself constructs an `axios` instance and an `http.Agent`
  with `request-filtering-agent` — that's the implementation, not a
  bypass. Don't flag the internal construction inside the `safeHttp`
  module.
- `apAxios` is the trusted-endpoint wrapper around `safeHttp` for
  Activepieces-owned services (`api.activepieces.com`,
  `secrets.activepieces.com`). It still uses `safeHttp` under the hood,
  so its presence is fine.
- Allow-list logic that reads `AP_SSRF_ALLOW_LIST` and merges it into
  the filter config is intentional; that env var is an operator
  override, not user input.

## Editions

This is a shared package used by both CE and EE; the rule against
`import … from "…/ee/…"` is moot here because `server-utils` has no
`/ee/` subtree of its own.
