# Tables Module

## Summary
A built-in relational database feature that lets users store structured data directly within Activepieces, without needing an external database. Tables support typed fields, cell-level storage, per-row webhooks that fire flow automations, and a rich spreadsheet-like editor in the UI. They are tightly integrated with the flow engine through the Tables piece, which provides trigger and action steps for reacting to and manipulating table data.

## Key Files
- `packages/server/api/src/app/tables/table/table.service.ts` — table CRUD, export, webhook management
- `packages/server/api/src/app/tables/table/table.controller.ts` — table endpoints
- `packages/server/api/src/app/tables/table/table.entity.ts` — Table entity
- `packages/server/api/src/app/tables/table/table-webhook.entity.ts` — TableWebhook entity
- `packages/server/api/src/app/tables/field/field.service.ts` — field CRUD
- `packages/server/api/src/app/tables/field/field.controller.ts` — field endpoints
- `packages/server/api/src/app/tables/field/field.entity.ts` — Field entity
- `packages/server/api/src/app/tables/record/record.service.ts` — record CRUD, bulk ops
- `packages/server/api/src/app/tables/record/record.controller.ts` — record endpoints
- `packages/server/api/src/app/tables/record/record.entity.ts` — Record entity
- `packages/server/api/src/app/tables/record/cell.entity.ts` — Cell entity
- `packages/server/api/src/app/tables/record/record-side-effects.ts` — fires TableWebhook flows on record events
- `packages/server/api/src/app/tables/tables.module.ts` — module registration
- `packages/shared/src/lib/automation/tables/table.ts` — Table schema
- `packages/shared/src/lib/automation/tables/field.ts` — Field schema and FieldType enum
- `packages/shared/src/lib/automation/tables/record.ts` — Record schema
- `packages/shared/src/lib/automation/tables/cell.ts` — Cell schema
- `packages/shared/src/lib/automation/tables/table-webhook.ts` — TableWebhook schema
- `packages/shared/src/lib/automation/tables/dto/` — request/response DTOs
- `packages/web/src/app/routes/tables/id/index.tsx` — the table editor page (react-data-grid based)
- `packages/web/src/features/tables/components/ap-table-header.tsx` — header bar with table name, actions
- `packages/web/src/features/tables/components/ap-table-state-provider.tsx` — state context for the table
- `packages/web/src/features/tables/components/ap-field-header.tsx` — column header with field actions
- `packages/web/src/features/tables/components/table-columns.tsx` — column definitions for react-data-grid
- `packages/web/src/features/tables/components/editable-cell.tsx` — cell editing wrapper
- `packages/web/src/features/tables/components/ap-table-actions-menu.tsx` — table-level action menu
- `packages/web/src/features/tables/components/import-table-dialog.tsx` — CSV import dialog
- `packages/web/src/features/tables/components/new-field-popup.tsx` — add field popup
- `packages/web/src/features/tables/hooks/table-hooks.ts` — React Query hooks for tables/fields/records
- `packages/web/src/features/tables/stores/store/ap-tables-client-state.tsx` — optimistic client-side state
- `packages/web/src/features/tables/stores/store/ap-tables-server-state.ts` — server-synced state
- `packages/web/src/features/tables/api/tables-api.ts` — table API calls
- `packages/web/src/features/tables/api/fields-api.ts` — field API calls
- `packages/web/src/features/tables/api/records-api.ts` — record API calls

## Edition Availability
- Community (CE): available
- Enterprise (EE): available
- Cloud: available

## Domain Terms
- **Table** — a named collection of typed columns (fields) and rows (records), scoped to a project
- **Field** — a typed column definition; types: `TEXT`, `NUMBER`, `DATE`, `STATIC_DROPDOWN`
- **Record** — a single row in a table; stored as a row entity with associated cells
- **Cell** — one value at the intersection of a record and a field (stored as VARCHAR)
- **TableWebhook** — a link between a table event and a flow; fires the flow when the event occurs
- **Table events** — `RECORD_CREATED`, `RECORD_UPDATED`, `RECORD_DELETED`
- **externalId** — a stable external identifier for tables and fields, used by the flow integration layer
- **Tables piece** — `packages/pieces/core/tables/`; provides trigger and action steps that interact with tables via the internal API

## Data Model

**Table**: id, projectId, name, folderId (nullable), externalId, trigger (nullable), status (nullable). Relations: project, folder, fields[], records[], tableWebhooks[].

**Field**: id, tableId, projectId, name, type, externalId, data (JSONB — e.g., `{ options: [{ value }] }` for STATIC_DROPDOWN).
- **FieldType**: `TEXT`, `NUMBER`, `DATE`, `STATIC_DROPDOWN`
- System limit: `AP_MAX_FIELDS_PER_TABLE` (default 100)

**Record**: id, tableId, projectId. Relations: table, cells[].

**Cell**: id, recordId, fieldId, projectId, value (VARCHAR). Unique constraint: (projectId, fieldId, recordId).

**TableWebhook**: id, projectId, tableId, flowId, events[] (string array).
- **Events**: `RECORD_CREATED`, `RECORD_UPDATED`, `RECORD_DELETED`

## Key Service Methods

- `table.create()` — creates table + optional fields
- `table.list()` — paginated with optional row count, name filter, folder filter, externalIds filter
- `table.update()` — rename, move to folder, change trigger/status
- `table.delete()` — cascades to fields, records, cells, webhooks
- `table.exportTable()` — returns fields + rows as JSON
- `table.createWebhook()` / `table.deleteWebhook()` — link table events to flows
- `record.create()` — bulk insert (max 50 per batch, transactional), validates field count
- `record.list()` — with filters (EQ, NEQ, GT, GTE, LT, LTE, CO, EXISTS, NOT_EXISTS)
- `record.update()` — update cells (empty fields unchanged)
- `record.delete()` / `record.deleteAll()` — bulk delete

## Side Effects

After record create/update/delete, `recordSideEffects.handleRecordsEvent()`:
1. Finds TableWebhooks matching the event type
2. For each matching webhook, triggers the linked flow via webhook service
3. Passes record data as payload

## Table → Flow Integration

Tables piece (`packages/pieces/core/tables/`) provides:
- **Triggers**: New Record, Record Updated, Record Deleted (register TableWebhook on enable, delete on disable)
- **Actions**: Create Record(s), Get Record, Find Records, Update Record, Delete Record(s), Clear Table
- Uses internal API with Bearer token authentication
