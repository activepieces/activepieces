# MCP Client

Connect a flow to an external MCP (Model Context Protocol) server and call a
specific tool deterministically — no LLM decides whether or when the tool runs.

- **Connection**: server URL + transport (Streamable HTTP / HTTP / SSE) + auth
  (None / Bearer token / API key / custom headers).
- **Call Tool** action: pick a tool from a dropdown populated via `tools/list`,
  map flow values to its inputs (driven by the tool's input schema), and use the
  raw tool result in later steps.
