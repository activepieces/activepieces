---
icon: 🧠
---

# Brain

Durable context for this repo. Every folder here is a page in Craftspace, and every page here is a file in
the repo, so the team reads the same thing whether they open GitHub or the app.

This page is a **spine**: one line per Area, pointing at the page that holds it. Hard-to-reverse calls live
as Decisions, not here.

## Areas

One line per Area, pointing at the page that holds it. Start at **context** if you are new here.

- **[context](context.md)** — the vocabulary, where things live, and the traps. The two-minute entry page.
- **[flows-execution](flows-execution/index.md)** — how flows are authored, triggered, executed and organised
- **[pieces-engine](pieces-engine/index.md)** — the piece catalog, visibility, formulas and how the engine runs a step
- **[execution-runtime](execution-runtime/index.md)** — where a job runs: the worker is the sandbox, concurrency 1 plus replicas
- **[connections-auth](connections-auth/index.md)** — credential storage and user auth. Connections filter on `projectIds[]`, never a scalar
- **[platform-editions-ee](platform-editions-ee/index.md)** — Platform → Project tenancy, and the CE/EE seam CE must never import across
- **[ai-intelligence](ai-intelligence/index.md)** — model backends, AI credit metering, and the Agent, MCP and copilot surfaces
- **[eventing-webhooks](eventing-webhooks/index.md)** — HTTP in and out, plus the internal bus carrying domain events
- **[data-storage-observability](data-storage-observability/index.md)** — tables, secrets, files, and how platform activity surfaces
- **[engineering](engineering/index.md)** — the engineering brain: how the system works and why it was built that way
- **[decisions](decisions/)** — every hard-to-reverse call, one file per decision

## How a page is shaped

One Area owns exactly one page, and that page is a glossary spine: one line per term, defining what the
term IS. A term that outgrows its line graduates to its own file beside the page. Search before you write —
a second page for an Area that already has one is the failure this structure exists to prevent.

## Gotchas

- Craftspace mirrors this folder read-only. Edit the files here and merge, and the pages follow.
- `<area>/index.md` is the page for `<area>`; a file beside it is that page's child.
