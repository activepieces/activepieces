---
id: ap-flow-timeout-seconds-now-also-bounds-a-single-action-run
title: "`AP_FLOW_TIMEOUT_SECONDS` now also bounds a single action run"
added: '2026-08-30'
release: 0.89.0
---

An action run — an agent's configured piece tool, a chat action, or MCP `ap_run_action` — used to be capped at a hardcoded 120 seconds, and a flow run started as an MCP tool at a hardcoded 300 seconds. Neither could be changed. Any agent tool whose action took longer than a minute failed outright with `RPC [executePieceTool] failed (timeout: 60000ms)`, because a second hardcoded limit in the worker cut it off first.

Both hardcoded limits are gone. All of them now follow `AP_FLOW_TIMEOUT_SECONDS`, the same setting that bounds a flow run, which defaults to 600 seconds. An action run therefore gets the same budget as a flow step.

The limit going up is the change to be aware of: a slow or hung action now occupies a worker slot for up to `AP_FLOW_TIMEOUT_SECONDS` instead of 120 seconds, and action runs are not covered by the per-project concurrency limiter. On a small worker pool, several slow actions can hold execution capacity for longer than they used to.

#### What you need to do

Nothing to configure or migrate, and no new environment variable — a default installation gets the fix with no action. Two things to consider if they apply to you. If you raised `AP_FLOW_TIMEOUT_SECONDS` for long flows, note that agent tools, chat actions and MCP action runs now inherit that same ceiling; lower it if you do not want them held that long. If you put Activepieces behind a reverse proxy and use MCP `ap_run_action`, an action that runs past the proxy's read timeout (nginx defaults to 60 seconds, Cloudflare to 100) returns a gateway error to the MCP client while the action keeps running — raise `proxy_read_timeout` if you rely on long action runs over MCP.
