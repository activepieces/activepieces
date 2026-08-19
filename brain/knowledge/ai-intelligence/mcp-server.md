---
icon: 🔌
---

# MCP Server

Exposes an Activepieces project as an MCP server so AI clients (Claude Desktop, Cursor, Windsurf) can read and manipulate flows, connections, tables, and runs through a typed tool interface. One `McpServer` record per project (UNIQUE `projectId`), authenticated by a bearer token. Available in CE, EE, and Cloud.

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

- Main protocol endpoint: `POST /v1/mcp/:projectId/http` (StreamableHTTP). Config: `GET/POST /v1/mcp/:projectId`, rotate token via `.../rotate`.
- Auth: `Authorization: Bearer {token}` or `?token=`. OAuth 2.0 PKCE also supported for clients that need it.
- AI pieces consume MCP tools over three transports: `SIMPLE_HTTP`, `STREAMABLE_HTTP`, `SSE`.
- Embed SDK adds `authorizeMcp()` (in-embed OAuth consent), `mcpSettings()`, and `generateMcpToken()` (mints `{ mcpServerUrl, mcpToken }` with no OAuth flow, backed by `POST /v1/projects/:projectId/mcp-server/token` — a short-lived 15-min project-scoped token).

### Gotchas

- Flow attribution: `ap_create_flow`/`ap_build_flow`/`ap_duplicate_flow` stamp `ownerId` (OAuth user) and `createdBy: { type: 'MCP', id }`.
- `MCP_SERVER_CONNECTED` is deduped to at most one/user/server/day (`telemetryDedupe.onceToday`) — a daily-active signal, not request volume. Per-call usage is `MCP_TOOL_CALLED`.
- OAuth discovery URLs are built via `domainHelper.getPublicUrlFromRequest` so subpath-hosted instances advertise the right prefix. `401`s carry an RFC 9728 `WWW-Authenticate: Bearer resource_metadata="…"` header. Host-root `.well-known/oauth-*` must still be forwarded to AP by the operator.
- **DCR must issue a client secret when `token_endpoint_auth_method` is omitted.** RFC 7591 §2 says an omitted value defaults to `client_secret_basic`, *not* `none`, and [Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-dynamic-client-registration) refuses DCR outright without one ("DCR without a client secret isn't supported yet"). Defaulting an omitted method to `none` looks like it fixes the "public client handed a secret" contradiction, but it resolves it the wrong way: it breaks Copilot and makes `client_secret_basic` support unreachable for every client that omits the field. Resolve it the other way — default to `client_secret_basic` and keep issuing the secret.
- `x-ap-conversation-id` header (EE chat) rebinds the server to a conversation's project, but only when scoping matches the token — it can never widen the grant.
- External MCP-server validation for the agent piece lives under `agents/`, NOT here (it's a probe, not the AP-as-server feature).

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
