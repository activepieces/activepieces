---
id: piece-versions-are-now-pinned
title: "Piece versions are now pinned"
added: '2026-04-07'
order: 1
release: 0.82.0
---

- Piece versions are no longer stored with wildcards (`~1.2.0`, `^1.2.0`). All piece steps now use exact versions (e.g. `1.2.0`).
- A migration automatically strips wildcard prefixes from all existing flow versions on upgrade.
- The `LOCK_AND_PUBLISH` operation no longer resolves piece versions at publish time — steps run with the exact version stored in the flow.
- A new **version switcher** UI in the builder lets users upgrade or downgrade piece versions manually.

In the REST API:

- `ADD_ACTION`, `UPDATE_ACTION`, and `UPDATE_TRIGGER` now strip wildcard prefixes (`~`, `^`) from `pieceVersion` before saving. If you were relying on wildcard versions to auto-resolve on publish, your steps will now be pinned to the base version (e.g. `~1.2.0` becomes `1.2.0`).
- `LOCK_AND_PUBLISH` no longer modifies `pieceVersion` on any step. The version in the draft is the version that will run.
- A new endpoint `GET /v1/pieces/:name/versions` is available to list all versions of a piece, useful for building custom version selection.

#### What you need to do

If you create or update flows via the REST API with wildcard versions (`~` or `^`), switch to exact versions; wildcards are silently stripped. If your publish flow relied on `LOCK_AND_PUBLISH` resolving wildcards, set the exact version on each step before publishing. Use `GET /v1/pieces/:name/versions` to list available versions.
