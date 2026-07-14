# Piece-set visibility is derived at read time, not materialized on install

A **Piece Set**'s `config` stores an **include/exclude selection**, and visibility is computed when pieces are listed — never written when a piece is installed.

```ts
PieceSetConfig = {
  pieces: { mode: 'include_all' | 'exclude_all'; exceptions: string[] }
  selectedActions: Record<pieceName, string[]>    // presence ⇒ "selected"; absent ⇒ "all"
  selectedTriggers: Record<pieceName, string[]>
}
```

- Pieces: `include_all` → visible = everything (present + future) minus `exceptions`; `exclude_all` → visible = only `exceptions`. This subsumes the old set-level `includeNewPieces` boolean (now `pieces.mode`).
- Components: an absent piece key means all actions/triggers are visible (new ones auto-appear); a present array is the visible allow-list (new/renamed names stay hidden).
- Resolution lives in two pure functions exported from `@activepieces/shared` (`isPieceVisible`, `isComponentVisible`), imported by both the server filter layer and the web UI.

## Why

The previous model was a **pure deny-list** (`disabledPieces`/`disabledActions`/`disabledTriggers`) plus policy flags (`includeNewPieces`, `curatedPieces`). A deny-list cannot declaratively express "hide things that don't exist yet," so the code answered that imperatively: a `pieceHooks.onPieceCreated` hook fired on every piece-metadata create — including the hourly `PIECES_SYNC` cron across **all** platforms — and walked every piece set in batches, materializing new pieces/actions into the deny-lists. A set with auto-include off accumulated the entire catalog into `disabledPieces` over time.

Storing the **visible allow-list** instead makes "new = not in the list = hidden" automatic. The whole write-on-install path is deleted: `handleNewPieceInstalled`, `computeConfigForNewPiece`, the `PieceHooks` interface and its EE wiring, and the per-version action/trigger diff in `pieceMetadataService.create`. The hourly sync no longer touches `piece_set`; managed-authn no longer enumerates the catalog to invert an allow-list.

## Consequences

- **Two representations, on purpose.** Pieces carry a `mode` (there is a genuine set-level "auto-include new pieces" policy); components are a bare allow-list (presence = curated) with no `mode` field. The presence/absence of a component key *is* the mode.
- **The update API is declarative.** `UpdatePieceSetRequestBody` sends `pieces` (full replace) and `actions`/`triggers` as a per-piece `ComponentIntent` (`{mode:'all'}` deletes the key; `{mode:'selected', selected}` sets it). This replaced 8 imperative enable/disable/curate ops and let the web visibility sheet drop its delta computation. An empty `selected` array is a valid "hide all of this piece's components" state and is never normalized to a delete.
- **Renames are treated as new.** A curated piece whose action is renamed hides the new name until an admin re-selects it — accepted, no reconciliation code.
- **Concurrent admin edits are last-writer-wins** (no row lock). The refactor removed the background writer, so the only remaining writers are two admins editing the same set simultaneously.

## Considered and rejected

- **Keep the deny-list, just refactor it.** Rejected: it retains the install-time cross-platform write fan-out and the unbounded `disabledPieces` growth — the core costs.
- **Uniform `{mode, exceptions}` at every scope (components included).** Rejected: components are strictly binary ("all" vs "selected"), so a component `mode` field would always be dead weight.
- **Run both representations during a transition.** Rejected: the feature is unreleased, so there is no migration window to protect; two coexisting models is the one path that *increases* complexity.
