---
icon: 🪪
status: accepted
---

# One OpenID Connect discovery document serves both workload federation and MCP user sign-in

## Decision

`/.well-known/openid-configuration` describes **both** OIDC purposes at once: the workload-identity
federation provider (engine-minted RS256 tokens that pieces present to AWS/GCP) and the MCP
authorization server's user-facing OIDC layer (`openid`/`email`/`profile`, `userinfo_endpoint`,
`id_token`). Its `issuer` — and the `iss` of every MCP `id_token` — is request-derived via
`domainHelper.getPublicUrlFromRequest`, matching `/.well-known/oauth-authorization-server`. The
workload token keeps `iss = FRONTEND_URL`, because the engine mints it over an internal call with no
public request context.

## Context

OpenAI rejected the Activepieces ChatGPT connector for enterprise domain restrictions, which require
an OIDC discovery document, a `userinfo` endpoint returning a verified email, and the `openid`/`email`
scopes. A relying party looks for that document at `<issuer>/.well-known/openid-configuration`, and
the issuer MCP clients discover from `oauth-protected-resource` is the origin root — where the
workload-federation document already lived. There is one issuer per origin, so the two cannot both
own that URL.

## Why

Giving MCP its own path-scoped issuer (`<host>/mcp`) is the cleaner separation and was rejected: it
changes the issuer every already-connected client (Claude, Cursor, ChatGPT) discovered against, for a
conflict that is only cosmetic — AWS IAM and GCP workload-identity pools read `issuer` and `jwks_uri`
and nothing else from the document, so the added MCP fields are inert to them. `response_types_supported`
moved from `['id_token']` to `['code']`, which is simply accurate: the authorization endpoint only
supports the code flow, and workload federation has no authorization endpoint at all.

Request-deriving the issuer was the reverse trade. Keeping `FRONTEND_URL` would have left an
`iss` mismatch on custom domains — an EE feature, and exactly the enterprise deployments the
ChatGPT connector targets — so every conformant RP would reject the `id_token` there. No working
federation setup regresses: AWS requires the document's `issuer` to equal the URL the customer
registered, so a functioning setup is always fetched at the `FRONTEND_URL` host, where the
request-derived value is identical.

## Consequences

- The MCP triple stays internally consistent on every host: `oauth-protected-resource` →
  `openid-configuration` → `id_token.iss`. Pinned by a custom-domain test in `mcp-oauth-oidc.test.ts`.
- Workload federation reached at a host other than `FRONTEND_URL` now returns that host as `issuer`
  while its tokens still say `FRONTEND_URL`. That configuration was already non-functional, but it
  now fails at token exchange rather than at provider setup.
- Both token families share one RSA key and `kid`. Safe today because their claim sets are disjoint
  and non-forgeable — the workload token's `sub` is server-fixed `platform:<id>:project:<id>` (never
  a user id) and it carries no `email`, so it can never satisfy a domain check; the `id_token`'s `aud`
  is a random server-generated `client_id` no customer would register with AWS. Separate keys only
  pay off alongside separate issuers, so that follow-up travels with a path-scoped issuer, not alone.
