# Gotcha: TypeORM soft-delete (@DeleteDateColumn) is NOT canary/rollback-safe on a shared DB

Switching an entity's deletes from hard `delete()` to `softDelete()` + a `@DeleteDateColumn` (`deleted` timestamp) is **backward-incompatible at the read layer** whenever two code versions share one Postgres — i.e. any canary release (canary shares prod DB) or a rollback.

**Why:** TypeORM only auto-appends `WHERE "deleted" IS NULL` for code whose entity *declares* the column. Old code that predates the column has no such filter, so it reads soft-deleted rows as **live**:
- During a canary window: a row deleted by new code reappears, live and editable, on any request served by old code.
- On rollback: every row new code soft-deleted permanently reappears for everyone, un-hideable until you re-migrate forward.
- Partially unrecoverable: old code's delete is a *hard* `DELETE`. If it deletes a resurrected row, the new "restore" feature can never bring it back — data gone.
- Bonus perf hit: rebuilding indexes as *partial* (`WHERE deleted IS NULL`) means old queries (no such predicate) can't use them → seq scans until re-migrated.

**Do it expand-contract instead:** (1) ship the column + make ALL read paths filter on it and roll that out everywhere first; (2) only after every node is new, flip the write path from hard-delete to soft-delete. The user-facing undo/restore feature still works; the deploy hazard disappears.

The additive column itself is fine — it's the **read-semantics change** that's unsafe to run split across versions. Same lesson applies to any "old code must now interpret a column it doesn't know about" migration.

Seen in PR #14219 (feat: chat core), where record soft-delete was added to give the AI chat agent a reversible `ap_delete_records` / `ap_restore_records`. Ironically the feature built to make *user* deletes recoverable made the *deploy* unrecoverable. Related: [[Gotcha: canary doesn't proxy websockets]].
