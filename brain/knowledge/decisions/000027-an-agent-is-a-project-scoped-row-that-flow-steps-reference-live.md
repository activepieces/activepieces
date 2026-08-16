---
title: An agent is a project-scoped row that flow steps reference live
icon: 🎯
status: proposed
---

Agents become a first-class entity: a `agent` row holding instructions, tools, model, max steps and
structured output. A Run Agent step stores only `agentId`; the server resolves the agent's config at
run start. Editing an agent changes the next run of every flow that links it, with no republish.

Agreed 2026-08-12, before implementation. Status stays `proposed` until Phase 2 lands.

## Why a live reference and not a snapshot

The whole point of naming an agent is to improve it once. A snapshot (dropdown prefills the step, link
then gone) makes every flow drift independently and turns "make the agent better" into per-flow
editing — which is the pain the feature exists to remove. Steps that genuinely need to differ get
**Detach & customise**, which copies the config inline and clears `agentId`, so the escape hatch is
explicit rather than the default.

The runtime cost of this is close to zero, which is what made the call easy: tools already reach the
agent loop through the job payload rather than the flow version, so the enqueue path substituting an
agent's tools needs no worker change. `flow_version.agentIds` + `extractAgentIds` +
the `flow.service.ts` filter also already exist from the deleted 2025 agents module, so "which flows
use this agent" comes for free.

## Why project-scoped

An agent's piece connections and flow tools are project-scoped already — `agent-run-controller`
resolves flow tools by `projectId`, and connections are matched with `ArrayContains([projectId])`. A
platform-scoped agent would need a project pin on every tool, rebuilding project scoping inside the
row. Visible to every member of the project, like flows and tables. Note this makes it the odd one out
next to `agent_conversation`, which is platform + user scoped with a mutable `projectId`.

## What this accepts, and how the line is held

Decision 000024 drew the line that *configuring a tool on an agent step authorises that action to run
unattended*. A live reference moves that authorisation to the agent definition: someone editing an
agent can add a write tool that then runs unattended in every flow linking it, without touching those
flows.

We accept that, and treat editing an agent as equivalent to editing a flow someone else published:

- a `WRITE_AGENT` permission gates the edit,
- the edit lands an audit-log entry,
- the editor shows **"Used in N flows"** beside the tools, so the blast radius is visible *before*
  saving.

No new gate and no new concept — the same trust model that already applies to flows. If that proves
too weak in practice, the next move is a per-agent "allow unattended writes" flag rather than
re-litigating the reference.

## Known cost: moving a flow between projects

This is the one place the reference genuinely costs something. A flow carrying `agentId` breaks when a
project release or git sync deploys it into another project — the id is project-local and the target
has no such row. `git-sync-helper.ts` and `clean-flow-state.ts` carry the connections a flow needs and
know nothing about agents.

Hence `externalId` on the agent row from day one, even though nothing reads it until the step
references an agent: adding it later is a migration plus a backfill. Project state must include the
agents a flow references and upsert them by `(projectId, externalId)`. If that lands later than the
reference itself, the import must **fail loudly** rather than silently link nothing.

## Also decided here

- **Table name.** Two orphaned tables (`agent`, `agent_run`) from the deleted 2025 agents module still
  sit in every upgraded database with no entity or service behind them. They get dropped so the new
  entity can take the obvious name; the migration is marked `breaking = true` for rollback safety, but
  needs no `⛓️‍💥 breaking-change` label since no customer-facing API or env var changes.
- **Autonomy stays a flow.** No second scheduler and no triggers on the agent row. "Run on a schedule"
  scaffolds a real flow with a trigger and a linked Run Agent step, so there is one execution model and
  one observability path.
- **Chatting with an agent is a third `AgentRunSource`**, not a nullable-`agentId` check. Every gate
  already branches on `source`, so an explicit enum value makes the audit greppable — and it keeps
  agent conversations out of the Chat list for free, since `listConversations` filters `source = CHAT`.
  Unlike a flow step, an agent conversation is **attended**: taint starts `false` and approval must not
  auto-decline.
