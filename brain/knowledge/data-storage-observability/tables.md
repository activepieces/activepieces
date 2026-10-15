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
- The piece's Create Record(s) action must not pass `retries` to `httpClient`: `POST /v1/records` is not idempotent, and a retry after a committed insert whose reply was lost (a proxy 5xx, a dropped connection) inserts the rows twice (ENG-800). The same lost-reply retry is not free on the actions that keep `retries: 5` either: Delete Record(s) then fails with a 404 for rows it already deleted, and Update Record fires the updated-record webhook twice.
- When adding any new table/field/record route, the `permission` arg to `securityAccess.project(...)` is required — passing `undefined` silently allows any project member.
- The per-create `field.validateCount()` check alone races on bulk paths: all concurrent creates read the same pre-save count and pass. Bulk/import paths (`table.create` with fields, project-state/project-replace apply) MUST call it once up front with the batch size **before** their `Promise.all`.
- The web table store keys each cell by the column's position (`fieldIndex`), not by field id, so every field mutator in `ap-tables-client-state.tsx` has to renumber surviving cells (`deleteField` didn't, see ENG-537). A cell edit sends only the edited cell, and `record.update` upserts just those cells, so stale indexes can't blank other columns on the server.
- Concurrent field reorders are last-write-wins, same as rename — no distributed lock. Reordering *existing* fields through project-release apply is not supported: `FieldState` carries no position, so array order only applies to newly created fields.
- The web client stores positional `cell.fieldIndex` references, so it must remap every record's cells when fields move.
- JSON import into an **existing** table is client-orchestrated and destructive-first: `tableHooks.importTableIntoExisting` clears records, deletes every field, renames, then recreates, as separate HTTP calls with no transaction. A failure after the clear leaves the table empty, so the import dialog validates the uploaded file with `tablesUtils.getTemplateError` in its form resolver, before the user can click Import. The import functions trust their typed input and do not re-validate; any new caller that feeds them unknown JSON must run the same check first. It checks the table name, the columns, the row structure, the field types and the dropdown options; `TableTemplate.fields[].type` is a bare `z.string()`, so the type check can't come from that schema. `externalId` is optional because already-exported files and `POST /v1/fields` allow it missing. Still unguarded: `MAX_FIELDS_PER_TABLE`, rows whose `fieldId` matches no column (they import as empty records), and a network failure mid-sequence. The client trims rows to the record limit, so the limit only bites if another writer adds rows during the import.
- Field `externalId` is optional on `POST /v1/fields` (`CreateFieldRequest`) but required on `POST /v1/tables`, whose `fields` are `FieldState[]`. So a template without column `externalId`s imports into an existing table but gets a 400 when used to create a new one.
- Re-importing into an existing table fires record webhooks for every row: the clear sends `deleted` and the insert sends `created`, so a flow on the deleted trigger runs once per old row and a flow on the created trigger runs once per imported row.
- CSV import only appends rows to an open table. It maps CSV columns onto the table's existing fields through the table store, so the import dialog offers CSV only when it has both a `tableId` and that store, which means only inside the table editor. Elsewhere the dialog accepts JSON only. Columns map by position: an empty value imports as a blank cell, but a row missing a middle column shifts every later value into the wrong field.

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
