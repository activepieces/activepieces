---
status: accepted
---

# AI provider resolution takes a required scope, and its reads split by trust level

## Decision

Every AI-provider resolver takes a **required** `ProviderScope` — `{ type: 'project', projectId } | { type: 'platform' }` — with no default and no optional `projectId`. The read endpoints split by who is asking: `GET /v1/ai-providers?projectId=` and `GET /v1/ai-providers/:provider/models?projectId=` are project-scoped (`securityAccess.project([USER, ENGINE], undefined, QUERY)`) and always apply the resolved key's model allow-list, while `GET /v1/ai-providers/configs` and `GET /v1/ai-providers/configs/:id/models` are `platformAdminOnly`, address an exact row, and return the unfiltered model list. The project list is deduped to one entry per provider and carries only `{ provider, name, enabledForChat }`.

## Context

Per-key project and model scoping arrived with the multi-key redesign (see [providers-redesign-before-routing](providers-redesign-before-routing.md)). The first cut made `projectId` optional on `resolveEligibleRow` because USER principals carry no project, and treated its absence as "every key on the platform is eligible". Over four review rounds the same finding was filed at four different locations — the MCP and chat paths, the agent piece and knowledge-base tool handlers, the chat/agent model picker, and the `configId` lookup — because each new caller that omitted the argument silently got platform-wide access. Separately, one `/models` route served the engine, ordinary project users and the platform admin console, so each fix aimed at one consumer opened a hole for another: addressing a key by name resolved the wrong row under multi-key, and adding a `configId` query param let any member reach a configuration excluded from their project.

## Why

A fail-open default in a credential resolver cannot be fixed by patching call sites, because the defect is the default and every future caller re-creates it. Making the argument required converts an omission into a compile error, and spelling `{ type: 'platform' }` turns the wide case into a claim a reviewer can check rather than an accident — only three consumers legitimately need it (the tool-search embedder, chat memory extraction, and the managed ACTIVEPIECES singleton). The route split follows the same principle at the HTTP boundary: `securityAccess` is per-route, so one route serving two authorization levels forces hand-rolled authz inside the handler, which is exactly the branch that leaked. Two routes let each state its own security config honestly.

## Consequences

`GET /v1/ai-providers` narrows: it no longer returns `id`, `config`, `modelIds` or `projectIds`, so a project caller can no longer see other projects' identifiers, and any new consumer wanting a full configuration must be a platform admin going through `/configs`. The AI piece's provider dropdown keeps working unchanged (it authenticates as ENGINE, which supplies its own project) but now sees one entry per provider instead of one per key, and its `AIProviderWithoutSensitiveData[]` annotation is wider than the real response. A project with no eligible key 404s rather than falling back to a platform key — scoping only ever narrows. Model routing, when revived, must keep addressing keys by row id and pass a scope like everyone else.
