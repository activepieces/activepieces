---
name: ubiquitous-language
description: Maintains feature documentation in .agents/features/ and performs mandatory feature overlap detection before any new feature is proposed. Also builds a shared domain vocabulary for Activepieces. Use when the user asks to define domain terms, build a glossary, harden terminology, create ubiquitous language, references "domain model" or "DDD", or asks about adding a new feature.
---

# Activepieces Ubiquitous Language

Maintain per-feature documentation in `.agents/features/`, establish a shared vocabulary for the Activepieces domain, and prevent redundant features by detecting overlap with existing functionality before any new work begins.

## Trigger Phrases

Activate this skill when the user:

- Asks to define domain terms, build a glossary, or harden terminology
- Mentions "ubiquitous language", "domain model", or "DDD"
- Says they want to "create ubiquitous language" or "align on terminology"
- Asks about adding, building, or proposing any new feature
- Uses a term ambiguously or inconsistently across the conversation

---

## Workflow

### Step 1: FEATURE OVERLAP DETECTION (mandatory before any new feature)

Before writing a single line of code or proposing a design for a new feature, you MUST check for existing features with similar or overlapping functionality.

**Search checklist — complete all five before concluding:**

1. **Feature docs** — read all `.md` files in `.agents/features/` to understand what features already exist, what they cover, and how they work. This is the primary source of truth for feature inventory.

2. **Components / services / hooks** — use the Glob tool to find files whose names relate to the proposed concept (e.g., `packages/**/*<keyword>*.{ts,tsx}`), then use the Grep tool to search file contents for the keyword. Also search by directory name patterns (e.g., `packages/server/api/src/app/<concept>/`).

3. **Route definitions** — use the Grep tool to check whether an API route already covers the use case: search for the keyword in `packages/server/api/src` with glob `*.ts`.

4. **Shared types** — use the Grep tool to inspect `packages/shared/src/` for existing type definitions or enums that represent the concept.

5. **Feature flags / plan limits** — use the Grep tool to search `packages/shared/src/lib/` for any existing capability or plan flag that may gate the feature.

**Decision rule:**

| Finding | Action |
|---|---|
| Close match exists | Present the match to the user. Recommend extending the existing feature. Do NOT proceed with a new feature without explicit user approval. |
| Partial overlap | Present overlapping parts. Ask whether the new feature should be merged into the existing one or kept separate, and document the rationale. |
| No match | Confirm to the user that no overlap was found, then proceed with the new feature design. |

Always present your findings to the user before proceeding. Never silently skip this step.

---

### Step 2: FEATURE DOCUMENTATION

Every feature in Activepieces must have a corresponding `.md` file in `.agents/features/`. This is a living registry that agents and developers use to understand what exists before building something new.

#### 2a. When creating a new feature

After the feature is implemented, create a new file at `.agents/features/<feature-name>.md` with this structure:

```markdown
# <Feature Name>

## Summary
One-paragraph description of what this feature does and why it exists.

## Key Files
- `packages/web/src/features/<path>` — frontend components
- `packages/server/api/src/app/<path>` — backend service/controller
- `packages/shared/src/lib/<path>` — shared types

## Edition Availability
Which editions support this feature (Community, Enterprise, Cloud).

## Domain Terms
Key terms used by this feature (link to glossary definitions if they exist).
```

#### 2b. When modifying an existing feature

After making changes to a feature, update its `.agents/features/<feature-name>.md` to reflect:
- New or removed key files
- Changed edition availability
- New domain terms introduced
- Any scope changes to the feature's summary

**This is not optional.** Every PR that changes a feature's behavior must include an update to its feature doc.

---

### Step 3: DOMAIN GLOSSARY MANAGEMENT

#### 3a. Scan the conversation for domain terms

As you read the conversation, collect every noun, verb, or phrase that:

- Names a core entity (e.g. Flow, Piece, Step, Run, Connection, Project, Platform)
- Names a process or action (e.g. publish, trigger, execute, sync)
- Carries specialised meaning in this codebase that differs from everyday usage
- Is used inconsistently or interchangeably with another term

#### 3b. Flag problems before writing the glossary

Before updating the glossary, surface any of the following to the user for resolution:

| Problem type | Example | How to flag |
|---|---|---|
| **Ambiguity** — same word, different meanings | "connection" means both a saved credential and a live socket | List both usages; ask which meaning should be canonical |
| **Synonym collision** — different words, same concept | "run" vs "execution" vs "flow run" | Identify the preferred term; mark the others as aliases to avoid |
| **Undefined jargon** — term used but never defined | "piece" first appears without explanation | Ask for a one-sentence definition |

Do not silently resolve ambiguities — always confirm with the user.

#### 3c. Write or update `.agents/features/GLOSSARY.md`

Create or update this file as the central domain glossary. Structure it as follows:

```markdown
# Domain Glossary — Activepieces

> Last updated: <date>

## <Domain Cluster Name>

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| Flow | A named automation consisting of a trigger and one or more steps. | workflow, automation, pipeline | Step, Trigger, Run |
| ... | ... | ... | ... |

## <Next Domain Cluster Name>

...
```

**Formatting rules:**

- Group terms into **domain clusters** (e.g., Automation Core, Platform & Multi-tenancy, Pieces & Integrations, Tables & Data, Authentication).
- Each definition is **one sentence only** — no exceptions. If a concept needs more explanation, link to a doc or ADR.
- The "Aliases to avoid" column lists terms that have been seen in the codebase or conversation but should be retired in favour of the canonical term.
- The "Related terms" column lists other glossary entries that are closely connected.
- Keep terms in **alphabetical order** within each cluster.

#### 3d. Canonical term enforcement

When writing or reviewing code, use only the canonical term from the glossary. If you see a deprecated alias in existing code, inform the user about each occurrence and let them decide whether to rename it now or track it as technical debt for later.

---

### Step 4: RE-INVOCATION (when called again in the same conversation)

When this skill is triggered a second or subsequent time in the same session:

1. Read the existing `.agents/features/` docs and `GLOSSARY.md` (do not recreate from scratch).
2. Identify new terms or features introduced since the last invocation.
3. Integrate new terms into the glossary, maintaining alphabetical order.
4. Create or update feature docs as needed.
5. Flag any fresh ambiguities or synonym collisions found in the new context.
6. Present a diff summary to the user: which terms/features were added, updated, or flagged.

---

## Quick Reference

| Task | Action |
|---|---|
| New feature requested | Run Step 1 (overlap detection via `.agents/features/` + codebase search) — always |
| Feature implemented or modified | Update its `.agents/features/<name>.md` via Step 2 |
| New term encountered | Add to glossary via Step 3 |
| Ambiguity detected | Flag to user before resolving |
| Skill re-invoked | Follow Step 4 (incremental update) |
| Deprecated alias found in code | Inform user; let them decide to rename now or defer as tech debt |

## Critical Reminders

1. **Feature overlap detection is not optional** — check `.agents/features/` and the codebase before every new feature, no exceptions.
2. **Feature docs must stay current** — every change to a feature's behavior requires an update to its `.agents/features/<name>.md`.
3. **One-sentence definitions** — longer definitions are a sign the concept needs to be split.
4. **Never resolve ambiguities silently** — always confirm the canonical meaning with the user.
5. **Aliases to avoid are as important as definitions** — they prevent synonym drift from creeping back into the codebase.
