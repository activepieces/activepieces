---
status: accepted
---

# AI step picker move and tier-slug rewrite share one flow migration, armed a release later

## Decision
Flow migration v28 → 29 (`migrateV28AiPieceModelPicker`) does two jobs at once. It moves AI piece text steps from `provider` + `model` onto the `aiProviderModel` picker value (piece-ai 0.15.0). It also rewrites the three old Credits model ids to the tier slugs they were picked as (ENG-753). It ships in one PR without being registered, and a three-line follow-up arms it one release later. Agent rows are not part of it.

## Context
ENG-753 (from the configurable-tiers stack) was postponed on 2026-09-26: old steps keep their pinned Credits model and only miss tier moves. Platform tiers PR 8 had to rewrite the same steps to move them onto the shared picker. Main had already used v27 → 28 for Oracle, so both wanted v28 → 29.

## Why
One migration means one schema bump and one flow-cache refill instead of two, and the two rewrites touch the same field on the same steps. It lands disarmed because the migration moves steps onto a piece version only the new release can render. Rolling a server back past a schema bump fails silently, so the code ships one release before the migration runs. Rejected: two migrations (v29 + v30), which double the deploy cost for no gain.

## Consequences
Armed by ENG-753 once cloud ran piece-ai 0.15.0; self-hosted needs a manual release holding PR 8 before one holding the armed migration.
The id map is frozen in the migration and must never import `ACTIVEPIECES_CHAT_TIERS`. Agent rows with old Credits ids still need their own rewrite before the built-in tier list changes, because `resolveNamedModelId` throws on them.
