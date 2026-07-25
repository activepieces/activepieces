---
name: grill-with-docs
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and records what lands in the brain/ folder (subsystem wiki pages, decisions, gotchas). Also runs mandatory feature-overlap detection before any new feature. Use when stress-testing a plan, defining domain terms, hardening terminology, or proposing/adding a new feature.
---

<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

</what-to-do>

<supporting-info>

## One destination: `brain/`

This repo carries its own brain and it syncs to Craftspace both ways. Everything this skill records is a **markdown file under `brain/`** — never a `upsert_*` MCP call, because a file rides the PR and review while an MCP write pushes straight to the default branch.

| What crystallised | Where it goes |
|---|---|
| A hard-to-reverse call with a real trade-off | `brain/decisions/<NNNNNN>-<slug>.md` |
| A domain term, a subsystem's behaviour, key files, edition availability | that subsystem's `brain/wiki/<area>/<slug>.md` |
| A trap that cost someone hours | `brain/wiki/<area>/gotcha-<what-bites-you>.md`, in the area it bites |
| A reusable procedure | `.agents/skills/<name>/SKILL.md` |

The repo keeps only what must be a file elsewhere: `AGENTS.md` (`CLAUDE.md` symlinks to it) and `.claude/rules/`, both loaded into every session, plus `docs/` which ships publicly. There is no `CONTEXT.md`, no `CONTEXT-MAP.md`, no `docs/adr/`, no `.agents/features/` — if you find one, it is a leftover; move its content into `brain/` and delete it.

**Grep `brain/` before you write.** It is on disk, so there is no excuse for a near-duplicate. Edit the file that already covers the topic.

## Areas nest; one page per subsystem

`brain/wiki/` is organized by **area**, one folder each, mirroring the bounded contexts: `execution-runtime`, `automation-core`, `pieces`, `authentication`, `data-storage`, `platform`, `eventing`, `ai`, `engineering`.

```
brain/wiki/<area>/index.md      ← the area's own page: glossary + a list of its children
brain/wiki/<area>/<page>.md     ← one subsystem, or one gotcha that bites in this area
```

A new page goes **inside the area it belongs to** — never at `brain/wiki/` root. If it fits no existing area, say so and agree on the area before creating one; a new top-level folder is a real change to how the codebase is carved up.

`index.md` carries the area's glossary and ends with a `## Pages` list, one line per child. When you add a page, add its line — a child nobody links to is a child nobody reads.

`brain/wiki/execution-runtime/index.md` is the reference — match its shape:

```markdown
---
icon: ⚙️
---

# Execution Runtime

Two sentences: what this subsystem is and the shape of it.

### 🏗️ Worker
Definition in one or two sentences — what it IS, not what it does.
- *Avoid:* "pool" — the N-box mode is a transitional bridge, not the deleted pool-server.

### 📦 Sandbox
...

## Key Files
- `packages/server/worker` — the poll loop
- `packages/server/sandbox` — the execution cache

## Editions
Community / Enterprise / Cloud

📁 Decisions: *Worker is the Sandbox* · *Transitional multi-box concurrency* · …
```

- `icon:` is a single emoji and renders on the page in Craftspace. Keep the emoji out of the `title`/H1.
- **Glossary discipline.** Be opinionated: one canonical word per concept, every retired alias on an `*Avoid:*` line. One or two sentences per term. Only terms specific to Activepieces — general programming concepts don't belong even if the project uses them heavily.
- **Don't mirror the public docs.** User-facing behaviour lives in `docs/` and ships to docs.activepieces.com. Link to it; never restate it. The brain covers what is *not* public: internal architecture, decisions, gotchas, domain language.

## Before grilling a NEW feature: overlap detection (mandatory)

Activepieces forbids redundant features. If the plan introduces something that sounds like a new feature, **stop and run overlap detection before grilling the design**. Complete all five checks before concluding:

1. **The brain** — Grep `brain/wiki/` and `brain/decisions/` for the concept and read what hits. This is the primary inventory of what already exists.
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
| **Synonym collision** — different words, same concept | "run" vs "execution" vs "flow run" | Identify the preferred term; mark the rest as `Avoid` |
| **Undefined jargon** — used but never defined | "piece" appears with no explanation | Ask for a one-sentence definition |

### Challenge against the glossary

When the user uses a term that conflicts with the canonical language on the area's `index.md`, call it out immediately. "`execution-runtime/index.md` defines Sandbox as the in-process box and lists 'pool' under *Avoid*, but you're saying 'pool' — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'connection' — do you mean the saved credential (App Connection) or a live socket?"

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios that probe edge cases and force precision about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees; surface contradictions. Keep multi-tenancy and editions in view — Activepieces is Platform → Project → User, and features differ across **Community / Enterprise / Cloud**.

### Write it inline — don't batch

The moment something crystallises, write the file right there, not at the end of the session.

## Offer decisions sparingly

Only offer to record a decision when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip it. If a decision is easy to reverse, you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The worker and the sandbox are one unit."
- **Integration patterns between subsystems.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no's are as valuable as the yes's.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.

### Decision format

One file per decision at `brain/decisions/<NNNNNN>-<slug>.md`. Flat, zero-padded to six digits, newest number last — scan the directory for the highest number and increment by one.

**Title it as the claim itself**, so the list reads as a set of positions rather than a set of topics: *Worker is the Sandbox: one job per worker, scale by replicas*, *Pieces are distributed as links, resolved lazily*, *Async webhook ACK is Redis-durable, not Postgres-durable*. The slug is the title, kebab-cased.

```markdown
---
status: accepted
---

# {The decision, stated as a claim}

## Decision
What we're doing, in the present tense. Concrete enough that someone could
tell whether the code complies.

## Context
What was true that forced the question. What this supersedes, if anything.

## Why
The reasoning that picked this option over the others.

## Consequences
What this costs us, what it rules out, what is still unproven.
```

`status:` is `accepted`, `proposed`, `deprecated`, or `superseded by NNNNNN`.

Keep it short — a good decision can be four short paragraphs. The value is in recording *that* a call was made and *why*, not in filling out sections. Drop `## Context` when nothing preceded it and `## Consequences` when nothing downstream is non-obvious; `## Decision` and `## Why` always earn their place.

Finally, add the decision to its subsystem page's trailing `📁 Decisions:` line so the page and the record point at each other.

</supporting-info>
