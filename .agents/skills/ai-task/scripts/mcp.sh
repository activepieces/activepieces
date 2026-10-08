#!/usr/bin/env bash
# Sends one JSON-RPC request (stdin) to the box MCP and prints the response.
set -uo pipefail
CFG=$(ls ~/.box/activepieces/*/.mcp.json 2>/dev/null | head -1)
[ -n "$CFG" ] || { echo "No box found. Run: box login --server https://box.abuaboud.me && box new -n chat-activation" >&2; exit 1; }
A=$(jq -r '.mcpServers.box.headers.authorization' "$CFG")
U=$(jq -r '.mcpServers.box.url' "$CFG")
H=(-H "authorization: $A" -H "content-type: application/json" -H "accept: application/json, text/event-stream")
HF=$(mktemp)
curl -s "${H[@]}" -D "$HF" -o /dev/null "$U" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"ai-roadmap-check","version":"1"}}}'
S=$(grep -i mcp-session-id "$HF" | cut -d" " -f2 | tr -d "\r" || true)
rm -f "$HF"
curl -s --max-time 300 "${H[@]}" ${S:+-H "mcp-session-id: $S"} "$U" -d @- | sed "s/^data: //" | grep -v '^\s*$' | grep -v '^event:'
