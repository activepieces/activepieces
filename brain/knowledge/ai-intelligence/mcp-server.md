---
icon: 🔌
---

# MCP Server

Exposes an Activepieces project as an MCP server so AI clients (Claude Desktop, Cursor, Windsurf) can read and manipulate flows, connections, tables, and runs through a typed tool interface. One `McpServer` record per project (UNIQUE `projectId`), authenticated by a bearer token. Available in CE, EE, and Cloud.

### Vocabulary

**Grant** — one row of `mcp_oauth_token`: this user's live authorisation for one registered client. The unit the connect page lists and revokes, named `McpOAuthGrant` and served from `/v1/mcp-oauth/grants`.
**Client** — one `mcp_oauth_client` registration row. Not a stable identity: Claude Code and Codex re-run DCR per sign-in, so one client-as-a-product yields many rows, and one user re-authenticating yields many grants. _Avoid_: using "client" for the thing being revoked.
**Connection** — belongs to piece auth (`AppConnection`), never to MCP. _Avoid_: "MCP connection" in code; the tab label "Connections" and the `/mcp-server/connections` URL are deliberate copy, not the domain term — the code under `app/routes/mcp-server/grants/` says grant.

### Entities & services

- **McpServer** — per-project record: `id`, `projectId` (unique), `token` (72-char), `disabledTools[]` (JSONB, nullable; `null`/`[]` means all controllable tools enabled).
- `mcpServerService.buildServer()` — builds the server per-request: metadata → dynamic flow tools → controllable + locked static tools → empty resources/prompts (spec compliance).
- Key files: `mcp/mcp-service.ts`, `mcp/mcp-server-controller.ts`, `mcp/tools/`, `mcp/oauth/`.

### Tools

- **Locked tools** — always on when MCP is enabled, cannot be disabled (e.g. `ap_list_flows`, `ap_flow_structure`, `ap_research_pieces`, `ap_get_piece_props`, `ap_list_connections`, `ap_list_tables`, `ap_get_run`).
- **Tool-search tools** — `ap_search_actions` / `ap_search_triggers`: semantic (pgvector) search over the action and trigger catalog with a keyword-floor fallback. Registered only when `AP_TOOL_SEARCH_ENABLED` is on — that env flag is the master switch, so their `LOCKED_TOOL_NAMES` entries are inert while it is off. The settings panel lists them via the `TOOL_SEARCH_ENABLED` flag.
- **Controllable tools** — toggled per-project via `disabledTools` (flow/step/branch management, publish, table + record ops, testing, run management).
- **Dynamic flow tools** — each enabled flow using the MCP trigger piece (`@activepieces/piece-mcp`) becomes a callable tool named `{toolName}_{flowId[0..4]}`; execution submits a webhook (sync if `returnsResponse`, else async).

### How it works

- Main protocol endpoint: `POST /mcp` at the domain root, plus `POST /mcp/platform` (StreamableHTTP), both registered in `server.ts`. Config lives under the project API (`GET/POST` on the project MCP server route).
- Auth is **OAuth-only**: `resolveIdentity` accepts an `Authorization: Bearer` value only if `mcpOAuthTokenService.verifyAccessToken` verifies it as a signed JWT with audience `JwtAudience.MCP_OAUTH_ACCESS`. There is no static-token authenticator and no `?token=` query path.
- AI pieces consume MCP tools over three transports: `SIMPLE_HTTP`, `STREAMABLE_HTTP`, `SSE`.
- Embed SDK adds `authorizeMcp()` (in-embed OAuth consent), `mcpSettings()`, and `generateMcpToken()` (mints `{ mcpServerUrl, mcpToken }` with no OAuth flow, backed by `POST /v1/projects/:projectId/mcp-server/token` — a short-lived 15-min project-scoped token).

### Gotchas

- **`mcp_server.token` is dead — nothing reads it.** It is written by the `getOrCreate` defaults and by both `/rotate` routes (`mcpServerService.rotateToken` / `rotatePlatformToken`), and consulted by **no authenticator**, so "rotating" it rotates a secret that grants nothing. It is still on the public `McpServer` zod schema, so the API keeps shipping a secret-shaped 72-char string that authenticates nothing — do not reach for it as a credential, and do not tell a self-hoster to. The settings panel is consistent with reality already (`mcp-credentials.tsx` renders the URL and *"Authentication is handled via OAuth"*, never a token). Deleting the column, the two routes, and the schema field is a breaking API-response change and has not been done.
- **`mcp_oauth_token.clientKey` is decided once, at sign-in.** `exchangeCode` derives it from the registration's
  redirect URIs via `mcpOAuthClientIdentity`, so the grants list can filter and group in SQL instead of loading
  every `mcp_oauth_client` row on the platform to re-derive keys in memory. Two consequences: sharpening the
  heuristic later does **not** relabel existing grants (they age out in 30 days, and an active client relabels on
  its next refresh, which backfills a NULL key), and `NULL` is not a third state — it means "signed in before the
  column existed" and reads as `unknown` everywhere, including the `?clientKeys=unknown` filter.
- **Claude Code and Codex re-run Dynamic Client Registration on *every* sign-in**, registering the exact
  ephemeral loopback port they are about to bind (`http://localhost:<port>/callback`,
  `http://127.0.0.1:<port>/callback/<callback_id>`). So the exact-string `validateRedirectUri` works and
  RFC 8252 port-agnostic matching is not needed — but a fresh `mcp_oauth_client` row and `clientId` is
  minted per sign-in, so `clientId` is **not** a stable identity for "a connected client", and those rows
  accumulate unbounded. Measured 2026-08-23 (Claude Code 2.1.235, Codex 0.149.0).
- **Never advertise `client_id_metadata_document_supported`** in the authorization-server metadata while
  `client_id` is validated against `^[A-Za-z0-9_-]{1,64}$`. Claude Code prefers a Client ID Metadata
  Document, whose `client_id` is a URL; it only falls back to DCR because we stay silent about CIMD.
  Advertising it without widening the `client_id` shape breaks Claude Code sign-in outright.
- **A static `Authorization` header is worse than none for MCP clients.** In Codex, setting `bearer_token_env_var` or an `Authorization` header short-circuits to bearer auth and skips OAuth discovery entirely; in Claude Code a rejected `Authorization` header surfaces as a failed connection rather than falling back to OAuth. So a partially-built static-token path silently disables the OAuth path that does work. Related: headless/CI (`claude -p`, the SDK) has no `/mcp` panel and therefore no supported way to connect today.

- Flow attribution: `ap_create_flow`/`ap_build_flow`/`ap_duplicate_flow` stamp `ownerId` (OAuth user) and `createdBy: { type: 'MCP', id }`.
- `MCP_SERVER_CONNECTED` is deduped to at most one/user/server/day (`telemetryDedupe.onceToday`) — a daily-active signal, not request volume. Per-call usage is `MCP_TOOL_CALLED`.
- **The MCP URL must be reachable without a redirect.** A cross-origin `301/302/307/308` strips the `Authorization` header in every spec-conforming client, and "cross-origin" includes the scheme — so a plain `http`→`https` canonicalisation at the proxy is as fatal as apex→www. It fails *loudly-looking-fine*: discovery is request-derived (`networkUtils.getRequestBaseUrl` reads `x-forwarded-proto`/host), so OAuth sign-in completes against the canonical origin while the client keeps POSTing the URL it was given, yielding permanent `401`s or a re-auth loop rather than a clean error. Activepieces never redirects there itself — the only prefixes are `/mcp` and `/mcp/platform`, and Fastify runs `ignoreTrailingSlash: true` so `/mcp/` matches the same route with no `301` — so it is always operator proxy config, and undetectable server-side (the proxy answers the pre-redirect request; AP never sees it).
- OAuth discovery URLs are built via `domainHelper.getPublicUrlFromRequest` so subpath-hosted instances advertise the right prefix. `401`s carry an RFC 9728 `WWW-Authenticate: Bearer resource_metadata="…"` header. Host-root `.well-known/oauth-*` must still be forwarded to AP by the operator.
- **DCR must issue a client secret when `token_endpoint_auth_method` is omitted.** RFC 7591 §2 says an omitted value defaults to `client_secret_basic`, *not* `none`, and [Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-dynamic-client-registration) refuses DCR outright without one ("DCR without a client secret isn't supported yet"). Defaulting an omitted method to `none` looks like it fixes the "public client handed a secret" contradiction, but it resolves it the wrong way: it breaks Copilot and makes `client_secret_basic` support unreachable for every client that omits the field. Resolve it the other way — default to `client_secret_basic` and keep issuing the secret.
- `x-ap-conversation-id` header (EE chat) rebinds the server to a conversation's project, but only when scoping matches the token — it can never widen the grant.
- External MCP-server validation for the agent piece lives under `agents/`, NOT here (it's a probe, not the AP-as-server feature).
- **Every registered tool must declare all three safety hints** — `readOnlyHint`, `destructiveHint`, `openWorldHint`. `McpToolDefinition.annotations` is optional and `buildToolConfig` passes it straight through, so an omitted hint is silent: MCP clients fall back to protocol defaults, but a ChatGPT Apps submission treats any missing hint as a blocker. The two dynamic paths are the easiest to miss because they build their tool config inline instead of from an `McpToolDefinition` — `registerFlowTools` (one tool per enabled MCP-trigger flow) and `registerPlaceholderTools` (the no-project-selected state, which is what a fresh external reviewer meets first). Placeholders annotate per list — locked names get the read-only triple, controllable names get `destructive: true, openWorld: true` — so a stand-in never advertises itself as safer than the tool it represents.
- **`openWorldHint` means the tool can change state in a third-party system**, not that it makes an outbound call. Anything that executes real connector steps needs it: `ap_test_flow`, `ap_test_step`, `ap_retry_run`, `ap_run_action`, and every dynamic flow tool. A read that only calls a connected account to populate dropdowns (`ap_get_piece_props`, `ap_resolve_property_options`, `ap_resolve_property_chain`) does not. `ap_retry_run` originally declared `false` here and was wrong — a retry re-runs the published flow and can resend the same Slack message or repeat an outbound write.
- The hints are **advisory metadata for the client, never enforcement**. Authorization stays with `permissionChecker.wrapExecute` and each tool's `permission`; changing an annotation changes what a client is told, not what a caller is allowed to do.

### Key files

Entry point: `mcpServerModule`, the Fastify plugin in `mcp/mcp-module.ts` registered from `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/mcp/` — module, service, entity, project + platform controllers, and the per-request `buildMcpServer`
- `packages/server/api/src/app/mcp/tools/` — locked and controllable tool definitions, plus curated piece expertise notes
- `packages/server/api/src/app/mcp/oauth/` — OAuth 2.0 PKCE flow: metadata, authorize, token, revoke
- `packages/core/shared/src/lib/automation/mcp/` — McpServer schema, McpToolDefinition, MCP OAuth types
- `packages/web/src/app/components/project-settings/mcp-server/` — settings panel: credentials, flows-as-tools, tool toggles
- `packages/web/src/app/routes/mcp-authorize/` — standalone OAuth consent page and its permission item
- `packages/web/src/app/routes/embed/` — the `embedded-mcp-*` dialogs for managed-auth consent and settings
- `packages/ee/embed-sdk/src/index.ts` — embed SDK public methods `authorizeMcp()`, `mcpSettings()`, `generateMcpToken()`
- `packages/web/src/features/agents/agent-tools/` — adding an external MCP server as an agent tool
- `packages/web/src/app/builder/test-step/custom-test-step/mcp-tool-testing-dialog.tsx` — test one MCP tool from the builder

Paths verified 2026-07-17.
