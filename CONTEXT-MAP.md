# Context Map — Activepieces

Activepieces is split into bounded contexts. Product/domain contexts live under `.agents/contexts/`; the execution-runtime contexts live next to the code they describe. Each `CONTEXT.md` is a glossary only — no implementation details. Decisions live in `docs/adr/`.

## Contexts

### Product domain (`.agents/contexts/`)

- [Automation Core](./.agents/contexts/automation-core/CONTEXT.md) — flows, versions, steps, triggers, and runs (what users build and what runs)
- [Data & Storage](./.agents/contexts/data-storage/CONTEXT.md) — Tables, Files, key-value state
- [Pieces & Integrations](./.agents/contexts/pieces/CONTEXT.md) — packaged integrations and the connections that authenticate them
- [Platform & Multi-tenancy](./.agents/contexts/platform/CONTEXT.md) — Platform → Project → User hierarchy, plans, roles, keys
- [Authentication & Security](./.agents/contexts/authentication/CONTEXT.md) — login, RBAC, audit, secret storage
- [AI & Intelligence](./.agents/contexts/ai/CONTEXT.md) — AI providers, credits, copilot
- [Eventing & Webhooks](./.agents/contexts/eventing/CONTEXT.md) — internal event bus and inbound/outbound HTTP
- [Releases & Environments](./.agents/contexts/releases/CONTEXT.md) — project promotion and Git sync
- [Platform Services](./.agents/contexts/infrastructure/CONTEXT.md) — alerts, MCP, templates, invitations, badges

### Execution runtime (next to code)

- [Execution Runtime](./CONTEXT.md) — where and how a flow job is executed: the Worker which is itself the Sandbox
- [Sandbox Pool](./packages/server/sandbox/CONTEXT.md) — the execution-cache / sandbox domain
- [Worker Runtime](./packages/server/worker/CONTEXT.md) — canonical terms for the worker package

## Relationships

- **Automation Core → Pieces**: a flow's actions and triggers are provided by Pieces; steps reference Piece Metadata.
- **Automation Core → Execution Runtime**: a published Flow becomes a FlowRun, executed by the Worker/Sandbox; RunTimeline phases (PROVISION, BOOT) map to runtime concepts.
- **Platform & Multi-tenancy** is the spine: every entity in every other context is scoped by `projectId` / `platformId`, and PlatformPlan gates feature availability by Edition.
- **Pieces ↔ Authentication**: App Connections may resolve secrets from a Secret Manager.
- **Eventing → Authentication**: Application Events feed Audit Events.
- **Eventing → Automation Core**: Webhooks and TableWebhooks are TriggerSources that start flows.
- **Releases → Automation Core / Data & Storage**: a Project Release snapshots flows, tables, and connections, cross-referenced by `externalId`.
- **AI → Automation Core**: the Agent step and Knowledge Base tools consume AI Providers and AI Credits.
