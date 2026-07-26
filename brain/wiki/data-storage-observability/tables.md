---
icon: 🗃️
---

# Tables

A built-in relational database inside Activepieces: users store structured data (typed columns, rows) without an external DB, edited in a spreadsheet-like UI and wired into flows. Available in CE, EE, and Cloud.

### Entities & services
- **Table** → **Field** (column) → **Record** (row) → **Cell** (value at record×field, stored as VARCHAR). All scoped to a project.
- **FieldType**: `TEXT`, `NUMBER`, `DATE`, `STATIC_DROPDOWN`. Field limit `AP_MAX_FIELDS_PER_TABLE` (default 100).
- **TableWebhook**: links a table event to a flow. Events: `RECORD_CREATED`, `RECORD_UPDATED`, `RECORD_DELETED`.
- Services: `table.service.ts`, `field.service.ts`, `record.service.ts`, `record-side-effects.ts`.

### How it works
- After record create/update/delete, `recordSideEffects.handleRecordsEvent()` finds matching TableWebhooks and triggers their linked flows with the record as payload.
- The **Tables piece** (`packages/pieces/core/tables/`) gives flows triggers (New/Updated/Deleted Record) and actions (Create/Get/Find/Update/Delete Record, Clear Table), calling the internal API with a Bearer token.
- RBAC: `READ_TABLE` / `WRITE_TABLE` via `securityAccess.project(...)`. VIEWER gets read only. `ENGINE`/`SERVICE` principals skip the role check.

### Gotchas
- Record filtering (EQ/NEQ/GT/CO/EXISTS/…) is **in-memory**, and a missing cell is treated as empty string `''`, so `NEQ`/`NOT_EXISTS` match unset columns.
- `record.create()` bulk insert caps at 50 per batch, transactional.
- When adding any new table/field/record route, the `permission` arg to `securityAccess.project(...)` is required — passing `undefined` silently allows any project member.

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
