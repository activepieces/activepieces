# Context Map — Activepieces

Activepieces is an AI-first workflow automation platform (self-hosted or cloud, 400+ pieces). Its domain splits into the bounded contexts below. Each context owns its vocabulary in a co-located `CONTEXT.md`; system-wide architectural decisions live in [`docs/adr/`](./docs/adr/).

This map is the entry point for the `domain-modeling` skill — read it first to find which context a term belongs to.

## Contexts

- [Automation](./packages/core/shared/src/lib/automation/CONTEXT.md) — the core engine: flows, versions, steps, triggers, and runs
- [Pieces & Connections](./packages/server/api/src/app/pieces/CONTEXT.md) — integrations and the credentials they authenticate with
- [AI & Agents](./packages/server/api/src/app/agents/CONTEXT.md) — LLM-driven agents, knowledge bases, providers, credits, and MCP
- [Tables & Storage](./packages/server/api/src/app/tables/CONTEXT.md) — built-in structured data and file/blob storage
- [Platform & Tenancy](./packages/server/api/src/app/platform/CONTEXT.md) — multi-tenant ownership, roles, plans, editions, and environment delivery
- [Authentication & Security](./packages/server/api/src/app/authentication/CONTEXT.md) — identities, sessions, SSO, provisioning, and audit
- [Eventing & Delivery](./packages/server/api/src/app/event-destinations/CONTEXT.md) — internal domain events, webhooks, and outbound event delivery

## Relationships

- **Platform & Tenancy → everything**: every entity in every context is scoped to a `Project` and/or `Platform`. Multi-tenant isolation is enforced on all queries (see [ADR-0001](./docs/adr/0001-multi-tenant-isolation.md)).
- **Automation → Pieces & Connections**: a flow's actions and triggers reference a `Piece`, and resolve credentials through an `App Connection`.
- **Automation → AI & Agents**: an `Agent` is a flow step type; flows can also be authored by an agent or the `Platform Copilot`.
- **Automation → Tables & Storage**: a `TableWebhook` fires a flow on record changes; `Sample Data` and run logs persist as `File` entities.
- **Automation → Eventing & Delivery**: a `Webhook` ingests external payloads to trigger a flow; flow failures raise an `Alert`.
- **All contexts → Eventing & Delivery**: security- and lifecycle-relevant actions emit an `Application Event`, which feeds `Audit Event` logging and `Event Destination` delivery.
- **Authentication & Security ↔ Platform & Tenancy**: a `UserIdentity` authenticates a User who holds a `PlatformRole` and per-project `ProjectRole`s.

## Flagged ambiguities (resolved)

- "run" / "execution" / "job" all referred to a single flow execution — resolved: the canonical term is **FlowRun** (see Automation).
- "connection" meant both a saved credential and a live socket — resolved: the saved credential is an **App Connection** (see Pieces & Connections); the live socket is never called a "connection" as a domain term.
- "workflow" / "automation" / "pipeline" / "scenario" all referred to the automation primitive — resolved: the canonical term is **Flow** (see Automation).
- "tenant" / "organization" / "workspace" referred to the top-level owner — resolved: **Platform** is the top-level tenant; **Project** is the workspace within it (see Platform & Tenancy).
