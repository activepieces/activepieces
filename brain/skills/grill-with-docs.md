---
name: grill-with-docs
description: Use when stress-testing a plan, defining/hardening domain terminology, or proposing a new feature in Activepieces. Runs mandatory feature-overlap detection and updates CONTEXT.md/ADRs/feature docs inline.
---

# Grill With Docs

Interview the user relentlessly about a plan, one question at a time (wait for each answer), giving your recommended answer. If a question can be answered from the codebase, explore instead of asking.

## Domain map

Repo is split into bounded contexts. Read `CONTEXT-MAP.md` first (lists contexts + relationships). Each context has a `CONTEXT.md` glossary; `docs/adr/` holds ADRs; `.agents/features/<feature>.md` is the per-feature registry; `.agents/contexts/<context>/CONTEXT.md` holds product-domain glossaries. Create files lazily — only when you have something to write.

## Before grilling a NEW feature: overlap detection (mandatory)

Activepieces forbids redundant features. Run all five checks and present findings before designing:

1. Feature docs in `.agents/features/` (primary inventory).
2. Components/services/hooks — glob `packages/**/*<keyword>*.{ts,tsx}` + check dir patterns.
3. Route definitions — grep `packages/server/api/src`.
4. Shared types — grep `packages/core/shared/src`.
5. Feature flags / plan limits — grep `packages/core/shared/src/lib`. Close match → recommend extending existing (no new feature without explicit approval). Partial → ask merge vs separate. No match → confirm, then proceed.

## During the session

- Scan for domain terms (entities: Flow/Piece/Step/Run/Connection/Project/Platform; processes: publish/trigger/execute/sync).
- Flag before resolving: ambiguity (same word, different meaning), synonym collision (pick canonical, mark rest `_Avoid_`), undefined jargon (ask for one-sentence def).
- Challenge terms that conflict with the context's `CONTEXT.md`. Sharpen fuzzy language to a canonical term.
- Cross-reference claims with code; keep multi-tenancy + editions (Community/Enterprise/Cloud) in view.

## Update docs inline (don't batch)

- Term resolved → update the context's `CONTEXT.md` (glossary only: definition + `_Avoid_:` line).
- Feature created/changed → update its `.agents/features/<feature>.md` (Summary, Key Files, Edition Availability, Domain Terms).

## ADRs — sparingly

Only when all three hold: hard to reverse, surprising without context, result of a real trade-off. Otherwise skip. ADRs live in `docs/adr/`, sequential numbering.

Full procedure in the repo: `.agents/skills/grill-with-docs/SKILL.md`
