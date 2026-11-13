---
title: MCP bills only ap_run_action
icon: 🧾
status: accepted
---

# MCP bills only ap_run_action

## Decision

An external MCP client pays 1 credit for `ap_run_action`, charged after the action job runs, also when the third-party call failed. Every other MCP tool is free and skips the out-of-credits check. A flow tool pays no MCP credit, because its production run is already billed. MCP calls do not touch the AppSumo AI-credit meter. This narrows the flat 1-credit-per-call charge from #15492.

## Context

#15492 charged every MCP call 1 credit, before the tool ran. Building one flow over MCP cost about 12 credits, while the same build in the builder or the in-app chat costs nothing. Out of credits, a client could not even list flows or turn one off. Flow tools were charged twice: once by MCP, once by the run meter.

## Why

An MCP call costs what the same work costs in the builder: runs and AI cost credits, building does not. `ap_run_action` is the only tool that runs work no other meter sees, so it keeps a flat credit, the same as chat's `ap_execute_action` (000042). The rejected option was to keep the flat per-call charge and lower its price; it still charges the channel we want customers to adopt and teaches models to skip validation.

## Consequences

`BILLABLE_TOOL_NAMES` in `mcpUsageTracker` lists the billed tools; a new tool is free unless added there. `ap_run_action` charges when its result succeeded or carries a `runId`, so a refusal before dispatch costs nothing. Five tools that run sandbox jobs (`ap_get_piece_props`, `ap_resolve_property_options`, `ap_resolve_property_chain`, `ap_test_flow`, `ap_test_step`) are free and watched through `MCP_TOOL_CALLED` telemetry.
