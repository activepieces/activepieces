# pieces-common

## What this codebase does

The piece-author-facing SDK every Activepieces piece imports (`@activepieces/pieces-common`).
Five subsystems: `http/` (the `httpClient` every piece uses for outbound HTTP),
`authentication/` (header/query/body auth converters), `helpers/` (mime, form-data,
etc.), `polling/` (trigger polling utilities), `validation/` (Zod-style checks for
piece inputs). Pure library; no runtime side effects on import.

## Auth shape

No auth surface of its own. `authentication/` contains converters that **apply**
piece auth (basic, bearer, OAuth2) to outbound requests; the credentials themselves
are resolved by the server. A bug in a converter — e.g. logging the bearer token,
or putting `apiKey=` into a URL query string that ends up persisted/logged —
leaks credentials at the scale of "every piece that uses that auth shape".

## Threat model

`httpClient` is the single point of failure for the SSRF posture of the entire
pieces ecosystem. The `server-utils` package has `safeHttp` for backend code;
`pieces-common` has `httpClient` for piece code — **they are not the same path**.
A regression in `httpClient` affects every Activepieces deployment because every
piece (core and community) imports it. The current implementation in
`src/lib/http/axios/axios-http-client.ts` has two known-bad patterns to confirm:
`axios.create()` with no `request-filtering-agent` (SSRF gap) and
`process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'` set as a side effect of every
request (process-wide TLS verification disabled — CWE-295 at worst possible blast
radius).

## Project-specific patterns to flag

- **CONFIRMED CRITICAL — global TLS verification disabled at runtime.**
  `src/lib/http/axios/axios-http-client.ts` line 31 sets
  `process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'` inside `sendRequest`, which
  fires on every outbound request. `NODE_TLS_REJECT_UNAUTHORIZED='0'` is a Node.js
  process-wide setting; once set, **all subsequent HTTPS calls from anywhere in
  the entire Node process** (engine bootstrap, other pieces, OAuth refresh,
  internal API calls) skip certificate validation. CWE-295. Investigate this
  under the TLS / cert-validation lens, not the env-leak lens, and report as
  CRITICAL or HIGH.
- **CONFIRMED HIGH — SSRF protection has been deleted from source.** The
  compiled `dist/src/lib/http/axios/ssrf.js` artifact still exports
  `getSsrfAgents` (a `request-filtering-agent`-backed helper), but the source
  file no longer exists in `src/lib/http/axios/` (only `axios-http-client.ts`
  remains there). A grep across `packages/pieces/` for `getSsrfAgents` or
  `request-filtering-agent` returns ZERO source matches. `axios-http-client.ts`
  uses `axios.create()` with no `httpAgent`/`httpsAgent` filtering. Every piece
  making a request to a user-supplied URL can reach private/loopback/metadata
  IPs. The stale `dist/` artifact may mislead reviewers into thinking
  protection is in place — confirm against `src/` only.
- **`process.env` mutation as a request side effect, generally.** Same shape
  as the TLS bug above. Any assignment to `process.env` during request handling
  (HTTP_PROXY override, debug flags, etc.) is a finding.
- **`axios.create()` / `new http.Agent()` / `new https.Agent()` without
  `request-filtering-agent`.** The SDK MUST wrap outbound HTTP in the filtering
  agent, the same way `server-utils`'s `safeHttp` does. Currently it doesn't.
- **DNS lookup overrides.** Any `lookup:` option to `http.request` / `axios` /
  `node:net` that bypasses the filtering agent would re-open the DNS-rebinding
  TOCTOU window.
- **Logging `request.headers`, `request.body`, `auth`, `params`, or
  `response.data` verbatim.** These carry user credentials and PII; a structured
  log call that takes one of these objects without redaction leaks at scale
  because every piece eventually hits this code path.
- **Auth converter writing credentials to URL query string.** Putting `apiKey=` /
  `token=` / `access_token=` into the URL means the credential ends up in proxy
  logs, error stack traces, and Sentry breadcrumbs. Headers are the safe channel.

## Known false-positives

- The `HttpClient` abstract class and the request/response types are the public
  API of this SDK — their existence is the point. Flag the **implementations**
  that bypass the filtering agent, not the interface definitions.
- Tests under `__tests__/` or `*.test.ts` may intentionally exercise edge cases
  (no-TLS-validation, malformed headers) against known fixtures; those aren't
  production code.

## Editions

Edition-agnostic; loaded by all editions. No `/ee/` subtree.
