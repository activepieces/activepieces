---
status: accepted
---

# A revoked MCP grant is blocked by a Redis revocation list, not by waiting out the token

## Decision
Revoking an MCP OAuth grant writes `mcp_oauth:revoked_grant:<grantId>` to Redis with a TTL of the access-token lifetime plus a minute, and every `POST /mcp` reads that key before serving. The access token carries the grant's row id as a `grantId` claim so there is something to read it by. Both revocation paths write it — `revokeGrants` behind the Reach tab, and the RFC 7009 `/revoke` a client calls on disconnect. A token with no `grantId` claim skips the check.

## Context
`revokeGrants` set `revoked = true` and stopped there. That kills the refresh flow, which reads the column — but `resolveIdentity` only verified the JWT signature and never consulted the row, so an already-issued access token kept calling tools for up to fifteen more minutes. The Reach tab reported the grant revoked the moment the request returned. The API was asserting something it had not made true.

## Why

**The token had nothing to key a revocation on.** The payload was `{ sub, projectId, platformId, clientId, scopes }` — no `jti`, no row id. `clientId` was the tempting shortcut and is wrong: a DCR registration is shared by every user who signed in through that client, so revoking one person's Claude grant would have killed strangers' live tokens. Tracking issued `jti`s per grant would have meant a Redis write on every token issue to enable a rare read. Stamping the grant's own id is one claim, no extra state, and it names exactly the thing the UI revokes.

**Checking the row in Postgres instead was the real alternative.** It is always correct, needs no TTL and no cache semantics, and the request path already runs several queries — one more indexed PK lookup would not have been the bottleneck. Redis won on it being the cheaper of two cheap things on a path that has no reason to grow a query, and on the list being self-emptying: a revoked grant stops costing anything the moment its tokens could no longer be alive.

**Failing open on a Redis error would have silently reinstated the bug.** The check fails closed, but answers `503` rather than `401`. A `WWW-Authenticate: error="invalid_token"` tells an MCP client its credentials are bad and several will drop the refresh token and push the user back through consent — a full re-authorisation over a 200ms hiccup. `503` makes them retry. Redis is already load-bearing for the API, so the availability coupling this adds is not new.

**Postgres is written first, and a Redis failure fails the request.** The reverse order would leave a grant that looks revoked for fifteen minutes and then quietly works again. Swallowing the Redis error would return `204` while the token still functions, which is the exact lie being removed. Retrying is safe: the row is already revoked and the refresh token already dead, so a retry only re-writes the keys.

**The TTL is derived, not typed.** `MCP_OAUTH_REVOKED_GRANT_TTL_SECONDS = MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS + 60`, both in `mcp-oauth-token-lifetimes.ts`, so tuning the token lifetime cannot leave the list covering less than the tail of it. The extra minute absorbs clock skew: a token signed on a node running behind Redis outlives an exact-lifetime key by the skew, and that gap would be silent.

## Consequences
- **Redis is now load-bearing for MCP authentication.** An MCP request whose token carries a `grantId` cannot be served while the revocation list is unreadable — it gets `503`. Before this, a Redis outage left `POST /mcp` working.
- **A claim-less token is trusted.** Tokens minted before this shipped, and internal chat tokens from `issueInternalAccessToken` which have no grant row, skip the check. The first population self-heals within fifteen minutes of deploy — `refreshAccessToken` stamps the claim, so even 30-day refresh tokens are covered — and the second is by design. The cost is a fifteen-minute window after deploy where a revoke behaves as it did before.
- **Platform teardown still leaves a residual window.** `platform-teardown-jobs` bulk-`DELETE`s `mcp_oauth_token` rows rather than revoking them, so no keys are written and tokens stay valid until they expire. Deliberate: the platform's data is being erased anyway, and covering it would mean either enumerating every id or a second platform-scoped key that turns the hot-path `GET` into an `MGET`.
- **`distributedStore` gained `putBatch(pairs, ttl)`**, a pipelined `SETEX`, so a bulk revoke of up to 100 grants is one round trip. `putBooleanBatch` already existed but takes no TTL.
