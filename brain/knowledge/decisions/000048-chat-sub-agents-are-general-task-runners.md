---
title: Chat sub-agents are general task runners, not role tools
status: accepted
icon: 🧵
---

# Chat sub-agents are general task runners, not role tools

## Decision

The chat has one delegation tool, `ap_run_task`. A task gets the same tools as the main chat, apart from the user-facing ones, plus a fresh context and one goal. Building, verifying, debugging and research are just different briefs. Tasks are stored per conversation in `agent_task`, and the same sub-agent can be resumed.

## Context

The first version (#16130) was a flow-builder-only sub-agent. 000046 planned separate architect, builder, verifier and debug roles. In practice, the work worth delegating (researching an app, triaging hundreds of records, fixing a failed run) did not fit a builder.

## Why

The value is the small, focused context, not a special toolset. One general tool keeps the main prompt small and avoids a tool per role. We rejected fresh sub-agents on every call: blocked tasks and follow-up edits would lose everything the task had learned.

## Consequences

Tasks cannot ask the user questions. They finish as `blocked`, and the main chat asks instead. They can still trigger approvals, which show the task's name. Parallel tasks need ownership written into their briefs, because flow draft edits are last-write-wins. Nesting is one level deep.
