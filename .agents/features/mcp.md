# MCP Module

## Summary
Exposes an Activepieces project as a Model Context Protocol (MCP) server so that AI clients (Claude Desktop, Cursor, Windsurf) can read and manipulate flows, connections, tables, and other project resources through a typed tool interface. Each project gets exactly one MCP server record with a bearer token for authentication; the server is built per-request from a combination of static locked/controllable tools and dynamic flow-as-tool entries.

## Key Files
- `packages/server/api/src/app/mcp/mcp-service.ts` — server build logic, tool registration, token auth
- `packages/server/api/src/app/mcp/mcp-server-controller.ts` — HTTP endpoints (get, update, rotate, issue embed token, protocol handler, agent validator)
- `packages/server/api/src/app/mcp/mcp-entity.ts` — McpServer entity
- `packages/server/api/src/app/mcp/tools/index.ts` — static tool exports
- `packages/server/api/src/app/mcp/tools/piece-expertise.ts` — curated, piece-specific guidance (expert notes, example inputs) surfaced through MCP property discovery
- `packages/server/api/src/app/mcp/oauth/` — OAuth 2.0 PKCE flow for MCP clients that require OAuth
- `packages/core/shared/src/lib/automation/mcp/mcp.ts` — McpServer schema, McpToolDefinition type
- `packages/core/shared/src/lib/automation/mcp/mcp-oauth.ts` — MCP OAuth types
- `packages/web/src/app/components/project-settings/mcp-server/index.tsx` — project settings panel for MCP
- `packages/web/src/app/components/project-settings/mcp-server/mcp-credentials.tsx` — token display and rotate UI
- `packages/web/src/app/components/project-settings/mcp-server/mcp-flows.tsx` — list of flows exposed as tools
- `packages/web/src/app/components/project-settings/mcp-server/mcp-tools.tsx` — controllable tool toggle UI
- `packages/web/src/app/routes/mcp-authorize/index.tsx` — OAuth authorization page for MCP clients
- `packages/web/src/app/routes/mcp-authorize/permission-item.tsx` — shared permission-item component used by the MCP OAuth consent screens
- `packages/web/src/app/routes/embed/embedded-mcp-authorize-dialog.tsx` — in-embed MCP OAuth consent dialog for managed-auth (embedded) users
- `packages/web/src/app/routes/embed/embedded-mcp-settings-dialog.tsx` — in-embed MCP settings dialog for managed-auth (embedded) users
- `packages/ee/embed-sdk/src/index.ts` — embed SDK; adds `authorizeMcp()` (in-embed OAuth consent), `mcpSettings()` (MCP settings dialog), and `generateMcpToken()` (mints `{ mcpServerUrl, mcpToken }` for the embed user's project without the OAuth flow) public methods
- `packages/web/src/features/agents/agent-tools/mcp-tool-dialog/index.tsx` — dialog to add an external MCP server as an agent tool
- `packages/web/src/features/agents/agent-tools/mcp-tool-dialog/add-mcp-tool-form.tsx` — form inside the dialog
- `packages/web/src/features/agents/agent-tools/components/mcp-tool.tsx` — inline display of an MCP tool in agent settings
- `packages/web/src/app/builder/test-step/custom-test-step/mcp-tool-testing-dialog.tsx` — test an individual MCP tool from the builder

## Edition Availability
- Community (CE): available
- Enterprise (EE): available
- Cloud: available

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **McpServer** — the per-project MCP server record (token, disabledTools)
- **Locked tools** — tools that are always active when the MCP server is enabled; cannot be disabled
- **Controllable tools** — tools that platform or project owners can enable/disable individually
- **Dynamic flow tools** — flows that use the MCP trigger piece and are registered as callable tools; tool name format is `{toolName}_{flowId[0..4]}`
- **StreamableHTTP** — streaming variant of the MCP protocol used for the primary `/http` endpoint
- **MCP trigger piece** — `@activepieces/piece-mcp`; a flow with this trigger is exposed as a callable tool via MCP
- **disabledTools** — JSONB array of controllable tool names currently disabled; `null` or `[]` means all controllable tools are enabled
- **Flow attribution** — `ap_create_flow`, `ap_build_flow`, and `ap_duplicate_flow` stamp `ownerId` (the OAuth-authenticated user who connected the client) and `createdBy: { type: 'MCP', id: <mcpServerId> }` on every flow they create. `ProjectScopedMcpServer` carries `userId?` so the tools can attribute ownership.
- **Embedded MCP OAuth** — in-embed consent flow where a managed-auth (embedded) user approves an MCP OAuth request inside the host app via the SDK's `authorizeMcp()`, instead of being redirected to a standalone Activepieces login they don't have. Backed by the `/embed/mcp-authorize` route and the existing `POST /v1/mcp-oauth/approve` (which accepts the embed USER session). `mcpSettings()` similarly renders the MCP settings page inside the embed.

## Entity

**McpServer**: id, projectId (UNIQUE — one per project), token (72-char auth), disabledTools[] (JSONB, nullable — defaults to []).

## Tools

**Locked tools** (always enabled if MCP is on):
- `ap_list_flows` — list all flows in project
- `ap_flow_structure` — get flow definition and structure
- `ap_read_step_code` — read full source code of a CODE step
- `ap_read_step_settings` — read the full untruncated settings of any step (trigger included): piece input, code source, loop items, router branches, error handling options
- `ap_validate_flow`, `ap_validate_step_config` — validation helpers
- `ap_research_pieces` — piece discovery with intent-based recommended-action ranking
- `ap_get_piece_props` — action/trigger input schema with required-input summaries and example input, action cardinality, curated expert notes (via `piece-expertise.ts`), AI description + idempotency hint, and output field paths (from a declared output schema, or derived from a trigger's sample data)
- `ap_resolve_property_options`, `ap_resolve_property_chain` — dropdown/property resolution
- `ap_list_connections` — list app connections
- `ap_list_ai_models` — list AI providers and models
- `ap_list_tables`, `ap_find_records` — table/record queries
- `ap_list_runs`, `ap_get_run` — run inspection
- `ap_setup_guide` — setup instructions

**Controllable tools** (can be toggled per-project):
- `ap_create_flow`, `ap_rename_flow`, `ap_build_flow`, `ap_delete_flow`, `ap_duplicate_flow` — flow management; `ap_build_flow` returns `flowUrl` (via `domainHelper.getPublicUrl`) in both text and structured output
- `ap_update_trigger` — change flow trigger
- `ap_add_step`, `ap_update_step`, `ap_delete_step` — step management
- `ap_add_branch`, `ap_update_branch`, `ap_delete_branch` — conditional branching
- `ap_lock_and_publish` — publish flow version
- `ap_change_flow_status` — enable/disable flow
- `ap_manage_notes` — add/update flow annotations
- `ap_create_table`, `ap_delete_table` — table management
- `ap_manage_fields`, `ap_insert_records`, `ap_update_record`, `ap_delete_records` — record operations
- `ap_test_flow`, `ap_test_step` — flow/step testing
- `ap_retry_run`, `ap_run_action` — run management

**Dynamic flow tools**: Each enabled flow with MCP trigger piece is registered as a callable tool. Name format: `{toolName}_{flowId.substring(0, 4)}`. Execution: submits webhook to flow (sync if `returnsResponse`, async otherwise).

## Tool Pattern

```typescript
{ title: 'ap_xxx', description: '...', inputSchema: zodSchema, annotations: { readOnlyHint, destructiveHint }, execute: async (args) => ({ content: [{ type: 'text', text: '...' }] }) }
```

## Endpoints

- `GET /v1/mcp/:projectId` — get MCP server config + populated flows
- `POST /v1/mcp/:projectId` — update disabledTools
- `POST /v1/mcp/:projectId/rotate` — rotate auth token
- `POST /v1/projects/:projectId/mcp-server/token` — mint a short-lived (15-min, `scopes: ['mcp']`), project-scoped MCP OAuth access token and return `{ mcpServerUrl, mcpToken }`. Secured with `securityAccess.project([USER], READ_MCP, { PARAM })`; reuses `mcpOAuthTokenService.issueInternalAccessToken` (the same path the chat assistant uses internally). Powers the embed SDK's `generateMcpToken()` — a no-OAuth alternative to the `authorizeMcp()` consent flow for hosts that already have an embed session.
- `POST /v1/mcp/:projectId/http` — StreamableHTTP MCP protocol endpoint (main protocol handler)

External MCP server validation for the **agent piece** lives under `packages/server/api/src/app/agents/` (endpoint: `POST /v1/projects/:projectId/agent-tools/mcp/validate`), not here — it's a probe for URLs the agent will later connect to, not part of the Activepieces-as-MCP-server feature.

## Authentication

Bearer token (`Authorization: Bearer {token}`) or query param (`?token={token}`). Returns 401 if invalid.

OAuth 2.0 PKCE flow is supported for AI clients that require OAuth. The MCP OAuth module (`mcp-oauth.module.ts`) registers metadata, authorization, token, and revocation endpoints.

**Client authentication methods** — `token_endpoint_auth_methods_supported` advertises `client_secret_post`, `client_secret_basic`, and `none`. Dynamic client registration (`/register`) defaults an omitted `token_endpoint_auth_method` to `none` (public client, PKCE only) and issues a `client_secret` only for the two confidential methods; the register enum rejects any other value. At the token and revoke endpoints the secret is read from the transport that matches the client's registered method — `client_secret_post` from the form body, `client_secret_basic` from the `Authorization: Basic` header — and credentials presented over the other transport are not accepted. A request that presents both a Basic header and a body secret is rejected with `invalid_request` (RFC 6749 §2.3 — a client must not use more than one authentication mechanism per request). Token responses carry `Cache-Control: no-store` and `Pragma: no-cache` (RFC 6749 §5.1). Shared credential parsing and per-method authentication live in `mcp-oauth-client-auth.ts`.

**Telemetry** — `resolveMcpAndUser` (the OAuth token-resolution path in `mcp-oauth.controller.ts`) runs on every authenticated MCP request, so `MCP_SERVER_CONNECTED` is deduped via `telemetryDedupe.onceToday` to at most one event per user+server per day (per API process) — a daily-active signal, not request volume. Per-invocation usage is tracked separately by `MCP_TOOL_CALLED`.

**Discovery & base-path awareness** — The OAuth issuer, `authorize`/`token`/`register`/`revoke` endpoints, the `resource`, and the `/mcp-authorize` redirect are built via `domainHelper.getPublicUrlFromRequest({ req, path })`. It keeps the request-derived host (so cloud custom domains still work) but appends the path prefix from `AP_FRONTEND_URL`, so subpath-hosted instances (`host/<prefix>/mcp` behind a reverse proxy) advertise URLs under the prefix. On root deployments the prefix is empty and behavior is unchanged.

**RFC 9728 §5.1** — MCP `401` responses include a `WWW-Authenticate: Bearer resource_metadata="…"` header pointing at the prefixed protected-resource metadata URL (`/.well-known/oauth-protected-resource/mcp` for project, `/mcp/platform` for platform), so clients can locate discovery without guessing host-root well-known paths. Clients that ignore the header and probe host-root well-known paths still require the operator to forward `host/.well-known/oauth-*` to AP (that namespace is host-root-anchored by RFC 8414/9728).

**Conversation-project scoping** — The optional `x-ap-conversation-id` request header (sent by the EE chat path) switches the built server to the project a prior conversation is bound to. The override is scoped to the token so it can never widen the grant: a project-scoped token resolves the header only when the conversation's project equals the token's own project, otherwise the header is ignored; a platform-scoped token requires the conversation's `platformId` to match the token's and re-validates the user's current project membership (`chatHelpers.getUserProjects`) before honoring it. A conversation with no `projectId` is ignored.

## Server Building

`mcpServerService.buildServer()` — built per-request:
1. Creates `McpServer` instance with metadata (name, version, icons)
2. Registers dynamic flow tools (from MCP trigger flows)
3. Registers controllable + locked static tools
4. Registers empty resources/prompts (MCP spec compliance)

## Agent Integration

AI pieces use MCP tools via 3 transport protocols:
- `SIMPLE_HTTP` — basic HTTP
- `STREAMABLE_HTTP` — streaming with `StreamableHTTPClientTransport`
- `SSE` — server-sent events
