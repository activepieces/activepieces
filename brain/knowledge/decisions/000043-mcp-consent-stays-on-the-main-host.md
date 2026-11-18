---
status: accepted
---

# MCP consent stays on the main host

## Decision
When a request arrives on `AP_MCP_URL`, the `/authorize` route redirects the browser to `AP_FRONTEND_URL`'s origin for `/mcp-authorize`, not to the MCP hostname it arrived on. The MCP hostname serves protocol routes only — no SPA, no `/api` — and the authorization code returns to the client's own `redirect_uri`, never to either host.

## Context
Self-hosters put MCP on a second hostname so that the MCP endpoint can be public while Activepieces itself is not — typically the app is VPN-only or IP-restricted, and a cloud MCP client cannot reach it. The OAuth flow then spans two parties: the client, which only ever talks to `AP_MCP_URL`, and the user's browser, which has to sign in and approve somewhere. Whichever host the browser lands on must be able to complete a full sign-in, and on self-hosted the SAML ACS URL is a single value derived from `AP_FRONTEND_URL`.

## Why
Consent on the main host is what lets single sign-on keep working with the IdP configuration the customer already has. The browser signs in on the same origin as the configured ACS, so the assertion comes back where the `sessionStorage` continuation was written and the flow resumes at `/mcp-authorize`. The rejected alternative — landing consent on the request origin, so the user finishes where they started — requires a second ACS URL registered at the IdP, and customers frequently cannot add one. It would also force the MCP hostname to proxy the whole app, defeating the narrow WAF surface that motivates a separate hostname, and cost a second sign-in because the session token is per-origin `localStorage`.

The accepted cost is that authorization is only possible from wherever the main host is reachable. That is acceptable because it is a one-time, interactive step, and everything after approval is client-to-`AP_MCP_URL` and works from anywhere.

## Consequences
A restricted main host is a supported deployment: an internal user authorizes once, and the cloud client works from anywhere afterwards. Nobody outside that boundary can authorize at all, which is documented against `AP_MCP_URL` rather than detectable at runtime — the server cannot know what the browser can reach. Anything that later varies the ACS per request must also widen the `createSamlClient` cache key, which is keyed by `platformId` alone.
