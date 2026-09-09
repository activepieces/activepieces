---
title: The worker-side AI path is Community-Edition core
icon: 🧱
status: accepted
---

## Decision

The route, job type, resume path and provider-credential resolver that let the worker run AI calls live
in **CE core, outside `src/app/ee/`** — even though every equivalent on the Agent path is Enterprise code.

## Context

Agreed 2026-09-08, alongside
[000035](./000035-direct-ai-steps-reuse-the-agents-suspend-and-resume-path.md), which puts the Direct AI
steps on the same suspend-and-resume route the Agent uses. That makes this decision sharper, not softer:
the pattern is being copied from code that is entirely Enterprise, into a place where it cannot be.

`agentModule`, which owns `POST /v1/agents/runs`, is registered only in the `CLOUD` and `ENTERPRISE`
branches of `app.ts`; on Community it is simply absent and the route 404s. `getAgentConfig`,
`saveAgentFile` and `resumeFlowStep` are likewise EE RPC handlers, each keyed on an agent conversation
row. That placement is correct for the Agent, which is an EE feature.

Ask AI, Summarize Text, Classify Text, Extract Structured Data and Generate Image are not. They ship on
Community today.

## Why

Putting the new path where the Agent's sits would silently remove five shipped Community actions — a
breaking change for self-hosters on the most-used AI steps.

The alternative was to leave Community on the in-sandbox path and move only EE. That was rejected
because it preserves `ai-sdk.ts` and the `ai@6` vs `ai@7` split forever, and removing that duplication is
the primary reason for the work. Shipping two execution paths would also mean maintaining both
indefinitely.

The price is that the Agent's EE helpers cannot be reused as they stand.

## Consequences

- The work is materially larger than "copy what the Agent does" — there are no `ee/` shortcuts, and every
  new surface must be edition-neutral. `getAgentConfig`, `saveAgentFile` and `resumeFlowStep` all key off
  an agent conversation row, so all three are rebuilt rather than reused.
- A new provider-resolution method on `WorkerToApiContract`, distinct from `getAgentConfig` and not tied
  to a conversation.
- The file-save path must be keyed on `projectId`/`runId` rather than `conversationId`, and must re-add
  the `AP_MAX_FILE_SIZE_MB` limit that `saveAgentFile` skips — otherwise Generate Image silently gains
  unbounded file writes.
- Community self-hosters get AI Provider credentials out of the sandbox, which was never previously on
  offer.
- The engine-facing `GET /v1/ai-providers/:provider/config` can only be closed once **every** edition is
  off it, so that deletion is a late layer of the stack, after the migration has promoted.

## See also

- [AI Providers](../ai-intelligence/ai-providers.md)
- [Platform, Editions & EE](../platform-editions-ee/index.md)
