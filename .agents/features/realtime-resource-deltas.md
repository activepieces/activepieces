# Realtime Resource Deltas

## Summary
A live "fill itself" channel: when a resource is mutated server-side, a granular delta is broadcast to the project's websocket room so any open view can patch its own state incrementally — no full refetch. First shipped for **tables**, so a table open in the Stage panel fills in live (rows cascade in, cells flash) while the chat agent writes to it. The pattern is deliberately generic so **flows** (and other resources) can adopt it with the same shape.

This sits on top of, and is distinct from, the **resource lock** (`RESOURCE_LOCKED`/`RESOURCE_UNLOCKED`, `LockerKind.AI`) which makes the view read-only while the agent works. The lock says "hands off + here's a banner"; deltas say "here's exactly what changed". The pre-existing unlock→refetch remains the reconciliation safety net.

## The pattern (4 parts)
1. **Emit from the service layer, not the controller.** Agent MCP tools call `recordService`/`fieldService` *directly* and bypass controllers' side-effects. Emitting inside the service method is the single chokepoint covering agent + REST + flow-piece callers uniformly. Best-effort (`tryCatchSync`) so a socket hiccup never breaks the mutation. Broadcast to the `projectId` room via `websocketService.to(projectId).emit(...)`.
2. **One concrete `WebsocketClientEvent` per op**, each carrying a self-contained payload: the **full resource object** on create/update (so the client merge is a pure idempotent upsert and never needs a refetch) and just the **id** on delete. Scoped by `{ projectId (room), resourceId }`; the client filters by resourceId.
3. **Idempotent-by-id client store action.** `applyServerDelta(delta)` upserts by id (create == update), removes by id, and adds/updates/removes fields. Idempotency is the reconciliation backbone — replay/overlap/duplication all converge. **Gated on the AI lock** (v1): only applied while the view is under `LockerKind.AI`, so the agent is the sole writer and there is no self-echo from the user's own edits.
4. **Subscribe-before-fetch + buffer + catch-up reconcile.** On entering the AI-active state, subscribe, buffer incoming deltas, fetch a fresh snapshot, reconcile it (idempotent upserts), then drain the buffer. Closes the window between the initial snapshot and the subscription when a view is opened mid-run.

## Tables implementation (reference)
- `packages/core/shared/src/lib/automation/websocket/index.ts` — `TABLE_RECORD_*` / `TABLE_FIELD_*` events + Zod payload schemas (`TableRecordCreatedEvent`, etc.). Shared version bumped on change.
- `packages/server/api/src/app/tables/table-realtime.ts` — `tableRealtime.recordCreated/Updated/Deleted/fieldCreated/Updated/Deleted`; best-effort emit helper.
- `packages/server/api/src/app/tables/record/record.service.ts` — emits in `create`/`update`/`delete`/`deleteAll` (after the txn commits).
- `packages/server/api/src/app/tables/field/field.service.ts` — emits in `create`/`update`/`delete` (delete fetches `tableId` before removing).
- `packages/web/src/features/tables/hooks/use-table-realtime.ts` — subscription hook: gates on `isAiActive`, buffers, catch-up reconcile, drains.
- `packages/web/src/features/tables/stores/store/ap-tables-client-state.tsx` — `applyServerDelta`, `reconcileServerSnapshot`, `recentlyChanged` (highlight tracking), `clearExpiredHighlights`; helpers `computeDeltaState`/`buildClientValues`/`mapFieldToClientField`.
- `packages/web/src/features/tables/stores/store/ap-tables-server-state.ts` — non-enqueuing mirror methods (`applyServerRecord`/`removeServerRecord`/`applyServerField`/`removeServerField`) so a later user edit resolves the correct record by index.
- `packages/web/src/app/routes/tables/id/index.tsx` — mounts the hook, `rowClass` for row-enter, auto-scroll follow, `ResourceLockWidget` banner.
- `packages/web/src/app/routes/tables/id/react-data-grid.css` — `ap-cell-flash` / `ap-row-enter` keyframes (respect `prefers-reduced-motion`).
- Tests: `packages/web/test/features/tables/stores/ap-tables-client-state.test.ts`.

## Gotchas (learned building tables)
- **The client store is positional, not id-keyed.** `ClientRecordData.uuid` is a client `nanoid` (NOT the server id) and cells address fields by **array index** (`fieldIndex`). The prerequisite was adding `recordId` to `ClientRecordData` for id-keyed apply. On **field add/delete you must re-index** every record's `fieldIndex` (filter the removed index, decrement those above it) — `values` don't store the fieldId, so a naive splice desyncs cells. This is the riskiest area; it's covered by the unit test.
- **Mirror the server-state, don't enqueue.** Server-originated deltas update the mirror used by user edits but must NOT re-issue API writes (unlike user-initiated create/update which enqueue via the PromiseQueue). Without the mirror, a user edit after the agent added rows resolves the wrong record by index.
- **Highlight without a render storm.** `recentlyChanged` holds `id → expiry`; CSS animations play on class apply; a single debounced `clearExpiredHighlights` timer prunes expired entries. Cell flash is selected per-cell so only changed cells re-render.

## Applying to flows (next)
Flows are the planned next adopter. Add `FLOW_*` delta events (same `{ projectId, resourceId, payload }` envelope), emit from the flow/flow-version service mutation methods (the agent edits flows via the same direct-service path), and consume with a `use-flow-realtime` hook of the same shape (gate on AI lock → idempotent apply → catch-up reconcile). The builder already has `use-flow-lock.ts` + `ResourceLockWidget` for the read-only banner; deltas would let the canvas update live instead of only on unlock.
