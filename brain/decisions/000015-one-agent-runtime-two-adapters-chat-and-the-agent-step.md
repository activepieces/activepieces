---
status: accepted
---

# One agent runtime, two adapters: chat and the agent step

## Decision
The Chat AI loop and the Agent piece's loop collapse onto one shared runtime, `@activepieces/core-agent-runtime`. Chat keeps its worker-job adapter; the agent step gets an **engine-hosted** adapter reached through a new `AgentContext.run()`, alongside the `AgentContext.tools()` seam that already exists. Old vs new agent-step behavior is a **profile** (config), not a second code path.

## Context
The two loops were written independently and shared nothing but `streamText` and the AI-provider config. Chat had accumulated every operational lesson — stream retry, truncation auto-continue, malformed-tool-call repair, a repeated-failure breaker, a per-turn token ceiling, in-loop context compaction, fast/smart model routing — and the agent step had none of them, nor any tests on its loop. No enhancement to one could ever reach the other. No prior decision reconciled the two "agent" concepts; `ai-intelligence/index.md` defines Agent as a flow step while the chat assistant lives under Flows & Execution and names its worker job `EXECUTE_CHAT_AGENT`.

## Why
**Engine-hosted, not a second worker job.** The obvious move — an `EXECUTE_AGENT_STEP` job mirroring `EXECUTE_CHAT_AGENT` — deadlocks. Worker concurrency is 1–5 per replica (see 000001); a flow job that blocks waiting on a *separate* agent job holds its slot, so N replicas can all block on agent steps with nobody free to run the loops. The engine already hosts `context.agent.tools()` (nested prop extraction, connection resolution, action execution) and already depends on `@activepieces/shared` and `ai@^6`, and `context.output.update()` already streams to the builder timeline. Extending that seam costs no job type, no queue, no RPC.

**Profiles, not a frozen fork.** "Don't change existing flows" implemented as a frozen old code path would preserve the exact duplication being removed. Making legacy-vs-unified a config value means resilience fixes reach everyone while intent stays frozen. Absence of the `profile` field means legacy, so no data migration is needed and locked flow versions are never touched.

**Agents are an EE feature, the step included.** Both the chat assistant and the agent step sit behind entitlement; there is no Community agent product.

## Consequences
Locked flow versions freeze piece versions in the bundle manifest (000005), so a never-edited published flow keeps running today's inline loop and does **not** receive the resilience fixes. Reaching those flows needs a version-pin migration, and it is not established that changing `settings.pieceVersion` on a locked version rebuilds its immutable, content-addressed bundle. Deliberately deferred until the stranded-flow count is measured.

EE cannot be expressed by directory here: `packages/ee/` holds only `embed-sdk`, and neither the engine nor pieces have an `ee/` partition — they ship to every edition by construction. The gate is a runtime `platform.plan` check, with the unified prompt and EE-only tool definitions served from the API so they never ship in the piece bundle.

**This is a customer-facing breaking change and must ship as one.** `OPEN_SOURCE_PLAN.agentsEnabled` and `STANDARD_CLOUD_PLAN.agentsEnabled` are both `true` on disk today (`core/shared/src/lib/ee/billing/index.ts`), so Community self-hosters and cloud-standard customers have working agent steps in published, scheduled flows. Gating the step revokes them. Requires the `⛓️‍💥 breaking-change` label plus a `docs/install/reference/breaking-changes.mdx` entry — CI enforces that the two travel together. Decide deliberately what a de-entitled step does to an existing run: failing the run is loud but breaks live automations, and skipping is silent; neither is free.

Approval gates and cross-session memory do not cross over: an unattended flow run has no approver, so the agent step auto-approves and leans on the existing read/write classification and taint rules, and memory maps to `context.store`. Pulling the runtime into the engine also risks the small worker image that 000001 preserves via a lazy-loaded chat agent — keep the unified profile's assets server-fetched.

Not addressed: there are still three separate ways to run a piece action from an LLM (`engine/src/lib/tools/index.ts` prop extraction, chat's `ap_execute_action`, and MCP's `ap_run_action`; the latter two share `executeAdhocAction`). This unifies the loop, not action execution.
