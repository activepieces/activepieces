---
id: mcp-oauth-revoking-a-token-requires-a-client-identity-and
title: "MCP OAuth: revoking a token requires a client identity, and registration issues a usable secret"
added: '2026-08-14'
release: 0.88.2
---

Two changes to the MCP OAuth endpoints:

- `POST /revoke` used to revoke a refresh token for a caller that presented no client identity at all, so anyone who learned a refresh token could disconnect its owner. It now requires the request to identify the client, and a confidential client to authenticate, per RFC 7009. A revocation that sends only `token` now returns `400 invalid_client`.
- Dynamic client registration (`POST /register`) that omits `token_endpoint_auth_method` now records the client as `client_secret_basic` and issues a client secret, per RFC 7591. It previously issued a secret but recorded the client as public, so that secret was never checked. A client registered from now on must present it when calling `/token` and `/revoke`. Concretely: a client that omits `token_endpoint_auth_method` **and** discards the `client_secret` it is handed now gets `400 invalid_client` at `/token`, where it previously succeeded. Such a client must either store and send that secret, or register explicitly with `token_endpoint_auth_method: "none"` to stay public.

#### What you need to do

Nothing for already-connected clients. A client's authentication method is read from the row it registered with, so existing registrations are untouched, including the ones created before this fix that hold a secret while recorded as public. Those keep working whether or not they send it.

Claude, Cursor and anything else built on the MCP SDK are unaffected: the SDK stores and sends the `client_secret` it is given, and it never calls the revocation endpoint. A confidential client's secret is accepted from either the request body or the `Authorization: Basic` header, so a client is never rejected for choosing one over the other.

If you maintain your own MCP OAuth client, check two things before upgrading: that it sends `client_id` when it revokes a token, and that it stores and presents the `client_secret` that `/register` returns. Note that disconnecting and re-adding an MCP server creates a fresh registration, so an existing user meets the new behaviour when they reconnect rather than at upgrade.
