---
status: accepted
---

# New chats start on one explicit Default chat model

## Decision
A platform has one **Default chat model** setting (`platform_configuration.defaultChatModel`): a tier, a key model, or a Credits tier, set from a card at the top of the Providers page. Every new chat starts there. Where it can't run (its key doesn't serve the project, or it was deleted), a new chat quietly falls back to the Default tier, the Default AI key, Credits, then the first option, and the card warns the admin. The Default AI key is derived from this setting, not set on its own.

## Context
Before, a new chat's model came from a hidden chain: Default tier → the Default AI key's first curated model → Credits → first option, with the Default AI key set from a button on a key page and "recommended" models starred in the picker. The PM and Louai found it unclear (2026-10-19): admins couldn't tell which model a new chat would use, or why, and the recommendations weren't backed by anything robust.

## Why
One explicit setting answers "what does a new chat use?" in one place, and folding the Default AI key into it leaves one concept to explain. Rejected: keep the rule chain and just explain it on screen. With recommendations gone, a key's "first model" is an arbitrary list order, so explaining the chain would describe a guess.

## Consequences
- One nullable jsonb column (migration 1875), no backfill. Existing platforms keep the old chain until an admin picks, and the chain keeps a Default AI key step so BYOK platforms aren't moved to Credits.
- Deleting the picked tier or key doesn't clean the setting: it falls back at read time and the card shows Unavailable.
- Bringing back recommendations needs a real recommendation system first.
