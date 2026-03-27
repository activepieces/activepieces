# MCP Module

Model Context Protocol server — exposes Activepieces to AI clients (Claude Desktop, Cursor, Windsurf).

## Entity

**McpServer**: id, projectId (UNIQUE — one per project), status (ENABLED/DISABLED), token (72-char auth), enabledTools[] (JSONB, nullable — defaults to ALL_CONTROLLABLE_TOOL_NAMES).

## Tools

**Locked tools** (always enabled if MCP is on):
- `ap_list_flows` — list all flows in project
- `ap_flow_structure` — get flow definition and structure
- `ap_list_pieces` — browse available pieces
- `ap_list_connections` — list app connections

**Controllable tools** (can be toggled per-project):
- `ap_create_flow`, `ap_rename_flow` — flow management
- `ap_update_trigger` — change flow trigger
- `ap_add_step`, `ap_update_step`, `ap_delete_step` — step management
- `ap_add_branch`, `ap_delete_branch` — conditional branching
- `ap_lock_and_publish` — publish flow version
- `ap_change_flow_status` — enable/disable flow
- `ap_manage_notes` — add/update flow annotations

**Dynamic flow tools**: Each enabled flow with MCP trigger piece is registered as a callable tool. Name format: `{toolName}_{flowId.substring(0, 4)}`. Execution: submits webhook to flow (sync if `returnsResponse`, async otherwise).

## Tool Pattern

```typescript
{ title: 'ap_xxx', description: '...', inputSchema: zodSchema, annotations: { readOnlyHint, destructiveHint }, execute: async (args) => ({ content: [{ type: 'text', text: '...' }] }) }
```

## Endpoints

- `GET /v1/mcp/:projectId` — get MCP server config + populated flows
- `POST /v1/mcp/:projectId` — update status and/or enabledTools
- `POST /v1/mcp/:projectId/rotate` — rotate auth token
- `POST /v1/mcp/:projectId/http` — StreamableHTTP MCP protocol endpoint (main protocol handler)
- `POST /v1/mcp/:projectId/validate-agent-mcp-tool` — validate external MCP server URL

## Authentication

Bearer token (`Authorization: Bearer {token}`) or query param (`?token={token}`). Returns 401 if invalid.

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
