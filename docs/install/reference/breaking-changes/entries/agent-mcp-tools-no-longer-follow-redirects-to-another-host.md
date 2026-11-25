---
id: agent-mcp-tools-no-longer-follow-redirects-to-another-host
title: "Agent MCP tools no longer follow redirects to another host, and the built-in MCP server limits request size"
added: '2026-11-09'
release: 0.93.0
---

Agents no longer follow a redirect from an external MCP server to a different scheme, host or port, so API keys never reach a host you didn't configure. Redirects on the same host still work.

The built-in MCP server (`/mcp` and `/mcp/platform`) rejects request bodies over 4 MiB with `413 Payload Too Large`. It returns a tool error, and does not run the tool, when the arguments hold more than 50,000 values (array items and object keys combined).

#### What you need to do

If an agent's MCP tool uses an `http://` URL or an old domain that redirects, replace it with the server's final `https://` URL. Split very large MCP tool calls into smaller ones.
