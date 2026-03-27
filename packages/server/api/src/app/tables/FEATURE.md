# Tables Module

Built-in database feature allowing structured data storage with flow automation triggers.

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
