# MCP (User Guide)

The built-in MCP server that lets AI assistants build flows, manage tables, and test automations in natural language. Source: `docs/mcp/`.

## Setup
1. Settings → MCP Server, toggle **on**, copy the **Server URL** (`https://your-instance.com/mcp`).
2. Add the URL to your MCP client config. Auth is **OAuth** — the client opens a browser to authenticate on first use. Works with Cursor, Claude Desktop, Windsurf, Claude.ai (Org Settings → Connectors → Custom connector).
3. Ask it things like "create a flow that Slacks when a Google Sheets row is added" or "show me the last failed run".

## Tool categories
Discovery tools are always available (locked, read-only); other categories can be toggled per-project:
- Discovery — explore flows, pieces, connections, tables, runs, and validation.
- Flow Management — create, duplicate, rename, publish, enable/disable.
- Flow Building — add/update/delete steps and triggers.
- Router & Branching — conditional branches.
- Annotations — canvas notes.
- Tables — full CRUD on tables, fields, records.
- Testing & Runs — test flows, inspect results, retry failures.
Full catalog with input schemas: `mcp/tools`. Key discovery tools include `ap_list_flows`, `ap_flow_structure`, `ap_read_step_code`, `ap_validate_flow`, `ap_research_pieces`, `ap_get_piece_props`.

## Self-hosting notes
Reachable at the host root and under a path prefix. For subpath deployments set `AP_FRONTEND_URL` to the full public URL including the prefix so the OAuth handshake stays inside your proxy rule. Credentials/secrets are never returned by any tool; all operations are project-scoped.
