---
icon: 🗃️
---

# Tables

A built-in relational database inside Activepieces: users store structured data (typed columns, rows) without an external DB, edited in a spreadsheet-like UI and wired into flows. Available in CE, EE, and Cloud.

### Entities & services
- **Table** → **Field** (column) → **Record** (row) → **Cell** (value at record×field, stored as VARCHAR). All scoped to a project.
- **FieldType**: `TEXT`, `NUMBER`, `DATE`, `DATETIME`, `STATIC_DROPDOWN`. Field limit `AP_MAX_FIELDS_PER_TABLE` (default 100), enforced by `field.validateCount({ insertCount })`.
- **position** (canonical term; avoid: order, displayOrder, index) — 0-based column order within a table. Fields list `position ASC, created ASC`, and `table.exportTable()` follows the same order.
- **TableWebhook**: links a table event to a flow. Events: `RECORD_CREATED`, `RECORD_UPDATED`, `RECORD_DELETED`.
- Services: `table.service.ts`, `field.service.ts`, `record.service.ts`, `record-side-effects.ts`.

### How it works
- After record create/update/delete, `recordSideEffects.handleRecordsEvent()` finds matching TableWebhooks and triggers their linked flows with the record as payload.
- The **Tables piece** (`packages/pieces/core/tables/`) gives flows triggers (New/Updated/Deleted Record) and actions (Create/Get/Find/Update/Delete Record, Clear Table), calling the internal API with a Bearer token.
- RBAC: `READ_TABLE` / `WRITE_TABLE` via `securityAccess.project(...)`. VIEWER gets read only. `ENGINE`/`SERVICE` principals skip the role check.
- Column reorder: `POST /v1/fields/reorder` takes `{ tableId, fieldIds }` (the full ordered id list the client already holds) and resequences positions to `0..n-1` in a single `UPDATE … unnest(fieldIds) WITH ORDINALITY` scoped by `projectId + tableId`, so foreign or stale ids are no-ops. Creates default to `MAX(position)+1` (append); imports pass the source array index so order never depends on insert timing. In the UI this is react-data-grid native column dragging (`draggable` columns + `onColumnsReorder`).

### Gotchas
- Record filtering (EQ/NEQ/GT/CO/EXISTS/…) is **in-memory**, and a missing cell is treated as empty string `''`, so `NEQ`/`NOT_EXISTS` match unset columns.
- `DATE` and `DATETIME` cells hold the **same** value — an ISO-8601 UTC instant from `toISOString()`. They differ only in the web editor (`DATETIME` adds a `TimePicker` beside the `Calendar`) and the display format. There is no per-type value coercion on write for any field type, so a date column can legitimately contain arbitrary text.
- Only `GT/GTE/LT/LTE` are date-aware, and only because `doesCellValueMatchFilters` is passed the field's type; every other operator compares the raw string. So `EQ` on a date column will not match two different spellings of the same instant (`…T14:30:00Z` vs `…T14:30:00.000Z`). Filters on a field type the evaluator can't resolve fall back to `parseFloat`.
- Adding a `FieldType` member means editing the enum **and** the non-dropdown `z.union([...])` branch in three places (`core/shared/.../field.ts`, `.../dto/fields.dto.ts`, `core/piece-types/.../tables.ts`) — miss the union and `POST /v1/fields` rejects the type. Also add a `case` to `field.service.createFromState`, whose `default:` throws `Unsupported field type` and which every template / project-release / MCP table-create path routes through. No migration is needed: `field.type` is a plain varchar with no Postgres enum or CHECK constraint.
- `record.create()` bulk insert caps at 50 per batch, transactional.
- When adding any new table/field/record route, the `permission` arg to `securityAccess.project(...)` is required — passing `undefined` silently allows any project member.
- The per-create `field.validateCount()` check alone races on bulk paths: all concurrent creates read the same pre-save count and pass. Bulk/import paths (`table.create` with fields, project-state/project-replace apply) MUST call it once up front with the batch size **before** their `Promise.all`.
- Concurrent field reorders are last-write-wins, same as rename — no distributed lock. Reordering *existing* fields through project-release apply is not supported: `FieldState` carries no position, so array order only applies to newly created fields.
- The web client stores positional `cell.fieldIndex` references, so it must remap every record's cells when fields move.

### Key files
Entry point: `tablesModule`, registered in `packages/server/api/src/app/app.ts` and mounting the three controllers under `/v1/tables`, `/v1/fields`, `/v1/records`.

- `packages/server/api/src/app/tables/tables.module.ts` — module registration and route prefixes
- `packages/server/api/src/app/tables/table/` — table service (CRUD, export, webhook management), controller, Table and TableWebhook entities
- `packages/server/api/src/app/tables/field/` — field service, controller, Field entity
- `packages/server/api/src/app/tables/record/` — record service (CRUD, bulk ops), controller, Record and Cell entities, record side effects that fire TableWebhook flows
- `packages/core/shared/src/lib/automation/tables/` — shared schemas for Table, Field, Record, Cell, TableWebhook, plus request/response DTOs
- `packages/web/src/app/routes/tables/id/index.tsx` — the table editor page, react-data-grid based
- `packages/web/src/features/tables/` — editor components, React Query hooks, client/server state stores, API calls
- `packages/pieces/core/tables/` — the Tables piece: triggers and actions flows use to read and write tables

Paths verified 2026-07-17.
