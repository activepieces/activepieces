---
name: grill-with-docs
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation inline (CONTEXT.md per bounded context, ADRs, feature docs). Also runs mandatory feature-overlap detection before any new feature and maintains the .agents/features/ registry. Use when stress-testing a plan, defining domain terms, hardening terminology, or proposing/adding a new feature.
---

<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

</what-to-do>

<supporting-info>

## Domain awareness

This repo is **Activepieces**. It is split into bounded contexts; each has a `CONTEXT.md` glossary, `CONTEXT-MAP.md` at the root lists them all and how they relate, and `.agents/features/` is the per-feature registry:

```
/
├── CONTEXT-MAP.md                     ← lists every context + relationships (read this first)
├── CONTEXT.md                         ← Execution Runtime context glossary
├── docs/adr/                          ← architecture decision records
│   ├── 0001-engine-posts-run-callbacks-directly.md
│   └── ...
├── packages/server/sandbox/CONTEXT.md ← Sandbox Pool context
├── packages/server/worker/CONTEXT.md  ← Worker Runtime context
└── .agents/
    ├── contexts/<context>/CONTEXT.md   ← product-domain context glossaries
    │                                     (automation-core, data-storage, pieces,
    │                                      platform, authentication, ai, eventing,
    │                                      releases, infrastructure)
    └── features/<feature>.md           ← one living doc per feature: the registry
```

Read `CONTEXT-MAP.md` first to find which context the current topic belongs to. Create files lazily — only when you have something to write; if a term belongs to a context that doesn't exist yet, add it to `CONTEXT-MAP.md` and create its `CONTEXT.md`.

## Before grilling a NEW feature: overlap detection (mandatory)

Activepieces forbids redundant features. If the plan introduces something that sounds like a new feature, **stop and run feature-overlap detection before grilling the design**. Complete all five checks before concluding:

1. **Feature docs** — read the `.md` files in `.agents/features/`; this is the primary inventory of what already exists.
2. **Components / services / hooks** — Glob `packages/**/*<keyword>*.{ts,tsx}` and Grep their contents; also check directory patterns like `packages/server/api/src/app/<concept>/`.
3. **Route definitions** — Grep `packages/server/api/src` (glob `*.ts`) for a route already covering the use case.
4. **Shared types** — Grep `packages/core/shared/src` for existing types/enums for the concept.
5. **Feature flags / plan limits** — Grep `packages/core/shared/src/lib` for a capability or plan flag that already gates it.

Always present findings before proceeding — never silently skip this:

| Finding | Action |
|---|---|
| **Close match** | Present it; recommend extending the existing feature. Do NOT design a new feature without explicit user approval. |
| **Partial overlap** | Present the overlapping parts; ask whether to merge into the existing feature or keep separate, and record the rationale. |
| **No match** | Confirm no overlap was found, then proceed with the new feature design. |

## During the session

### Scan for domain terms

As you grill, collect every noun/verb/phrase that names a core entity (Flow, Piece, Step, Run, Connection, Project, Platform), names a process (publish, trigger, execute, sync), carries codebase-specific meaning, or is used inconsistently.

### Flag ambiguity before resolving — never resolve silently

| Problem | Example | How to flag |
|---|---|---|
| **Ambiguity** — same word, different meanings | "connection" = saved credential vs live socket | List both usages; ask which is canonical |
| **Synonym collision** — different words, same concept | "run" vs "execution" vs "flow run" | Identify the preferred term; mark the rest as `_Avoid_` |
| **Undefined jargon** — used but never defined | "piece" appears with no explanation | Ask for a one-sentence definition |

### Challenge against the glossary

When the user uses a term that conflicts with the canonical language in the relevant context's `CONTEXT.md`, call it out immediately. "Automation Core defines 'run' as FlowRun and lists 'execution' under _Avoid_, but you're using 'execution' — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'connection' — do you mean the saved credential (App Connection) or a live socket?" Honour the **canonical term + _Avoid_** discipline: pick one canonical word, list the rest under `_Avoid_`.

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios that probe edge cases and force precision about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees; surface contradictions. Keep multi-tenancy and editions in view — Activepieces is Platform → Project → User, and features differ across **Community / Enterprise / Cloud**.

### Update the docs inline — don't batch

When a decision crystallises, capture it right there:

- **A term is resolved** → update the matching context's `CONTEXT.md` (find it via `CONTEXT-MAP.md`) using [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md): a one/two-sentence definition plus an `_Avoid_:` line for retired aliases. If no existing context fits, add a new one to `CONTEXT-MAP.md` and create its `CONTEXT.md`. `CONTEXT.md` files are glossaries — no implementation details, specs, or decision logs.
- **A feature is created or its behaviour/files/edition/scope changed** → update its feature doc (see below).

## Feature documentation registry

Every feature has a living doc at `.agents/features/<feature>.md`. It's the registry the overlap check reads. Keep it current — **every change to a feature's behaviour requires updating its doc** — using this structure:

```markdown
# <Feature Name>

## Summary
One-paragraph description of what this feature does and why it exists.

## Key Files
- `packages/web/src/features/<path>` — frontend components
- `packages/server/api/src/app/<path>` — backend service/controller
- `packages/core/shared/src/lib/<path>` — shared types

## Edition Availability
Which editions support this feature (Community, Enterprise, Cloud).

## Domain Terms
Key terms used by this feature (link to their CONTEXT.md context).
```

When modifying an existing feature, reflect new/removed key files, changed edition availability, new domain terms, and any scope change to the summary.

## Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md); ADRs live in `docs/adr/` with sequential numbering.

</supporting-info>
