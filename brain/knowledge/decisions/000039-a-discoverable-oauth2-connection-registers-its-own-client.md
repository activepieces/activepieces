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

`http-oauth2` has the identical manual-entry problem and can adopt the same descriptor. Reconnecting
registers a fresh client and orphans the previous one on the authorization server. RFC 8707
`resource` is sent on the authorize request only (baked into the discovered URL's query string);
putting it on the token and refresh requests needs a field on `OAuth2RequestBody`, threading through
three claim sites, and persisting it for refresh. Self-hosters pointing at an internal MCP server hit
`safeHttp`'s SSRF filter and must set `AP_SSRF_ALLOW_LIST`.
