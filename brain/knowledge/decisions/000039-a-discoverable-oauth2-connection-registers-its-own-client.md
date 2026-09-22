---
icon: 🔐
status: accepted
---

# A discoverable OAuth2 connection registers its own client

## Decision

`PieceAuth.OAuth2` takes an optional `discovery` descriptor naming which of its props hold the
server URL and which receive the discovered endpoints. When it is set, the **existing**
`POST /v1/app-connections/oauth2/authorization-url` endpoint — not a new route — reads the server's
RFC 9728 → RFC 8414 `.well-known` metadata, registers a client via RFC 7591 Dynamic Client
Registration, merges the results into `props`, and returns them to the connect dialog as a
`discovered` payload. The dialog writes them into the form and then follows the unchanged
popup → upsert path. v1 registers a **confidential** client and rejects servers that issue public
(secret-less) ones.

## Context

MCP servers authenticate over OAuth2 but typically have no developer console: the endpoints are
published as metadata and credentials are self-registered. Asking a user for Authorize URL, Token
URL, Scopes, Client ID and Client Secret asked for five values they mostly cannot obtain. The first
attempt shipped those as a piece action whose output the user pasted into the connection form, which
worked but read as a workaround.

## Why

Claim derives the token URL from the submitted `props` via the existing `'{tokenUrl}'` template, and
refresh reads `token_url`/`client_id`/`client_secret` off the **stored** connection value without
ever consulting piece metadata again. So discovery only has to run once, and routing its results
through `props` means the token exchange and refresh code — the delicate part — is untouched.

A dedicated `/oauth2/discover` route was rejected: `buildAuthorizationUrl` already needs a resolved
`authUrl` and a client id, so discovering anywhere else means asserting placeholders against props
that are still empty. Folding it in also saved a request DTO, an API client method and an error path.
A new `AppConnectionType` was rejected outright — every claim/refresh/redaction switch would grow a
case for something that is an ordinary OAuth2 connection once established.

Public clients were deferred rather than supported: the claim path does `body.client_secret =
request.clientSecret!` then `String(value)`, so a secret-less client literally posts
`client_secret=undefined`. Real support means four coordinated touchpoints (the zod `min(1)`, the
claim body, the claim Basic header, and refresh's `resolveString({ throwOnFailure: true })`) in
exactly the code this design set out not to touch.

## Consequences

Fully backward compatible, confirmed by checking every gate rather than assuming: `discovery` is
`undefined` for every piece except `mcp-client` (grepped `packages/pieces/community/*` for it), so
`discoverOAuth2Client` returns `undefined` on its first line and `buildAuthorizationUrl` falls
through to the original code unchanged; every web-side branch (`isClientSecretValid`, `isPropsValid`,
hiding Client ID/Secret, `hiddenPropNames`) is gated on the same flag and collapses to its original
condition too. The one shared-code change, `assertPlaceholdersResolved` skipping `required: false`
props, doesn't even apply to `http-oauth2`'s identical `'{authUrl}'` template — its `scopes` prop is
`required: true`. Already-claimed connections on any piece are entirely unaffected: refresh reads
`token_url`/`client_id`/`client_secret`/`props` off the *stored* value, and that code path was never
touched.

`http-oauth2` has the identical manual-entry problem and can adopt the same descriptor. Reconnecting
registers a fresh client and orphans the previous one on the authorization server.

RFC 8707 `resource` was initially sent on the authorize request only; a later pass threaded it
through the token and refresh requests too (`OAuth2RequestBody`, both `credentials-oauth2-service.ts`
paths, persisted on the connection value). This wasn't a net-new class of gap — `pieceAuth.extra`
(a static per-piece query-param map) already had the identical limitation: spread into
`buildAuthorizationUrl`'s query params, never referenced in `credentials-oauth2-service.ts`. No
piece before this one ever needed a value on both legs, because no existing piece's authorization
server issues tokens for more than one resource server — the gap was real in shape but dormant until
an AS-multiplexing case (MCP servers sharing one Auth0/Okta tenant) actually exercised it. The fix
threads `resource` through `commonOAuth2ValueProps`, shared by all three OAuth2 connection types
(`OAUTH2`, `CLOUD_OAUTH2`, `PLATFORM_OAUTH2`) for consistency with how `props`/`code_challenge`/
`scope` are already uniform there — but only the plain `OAUTH2` branch ever populates it in practice,
since `CLOUD_OAUTH2`/`PLATFORM_OAUTH2` use a platform-admin-configured predefined app, and no piece
today has both a predefined app and `discovery` set. The other two call sites are consistent, not
currently exercised — narrowing `resource` to just `UpsertOAuth2Request` was considered and rejected
in favor of matching the existing uniform-field pattern.

Self-hosters pointing at an internal MCP server hit
`safeHttp`'s SSRF filter and must set `AP_SSRF_ALLOW_LIST`.
