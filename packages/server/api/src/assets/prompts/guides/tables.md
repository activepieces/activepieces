# Activepieces Tables

Activepieces **Tables** are a lightweight database built into every project — no external database or connection needed. Use them to store and look up structured data across flow runs.

## When to use a Table

Reach for a Table whenever a flow needs to **remember or look up data**:

- Persisting state between runs (e.g. a "last processed id", or a log of seen items for deduplication)
- Logging records (every lead, order, inbound email, error)
- Small datasets the flow reads from (lookup/mapping tables, allow-lists)
- Collecting submissions to review later

**Prefer Tables over Google Sheets** when the data lives inside Activepieces and doesn't need a spreadsheet UI — Tables are faster, typed, and need no connection/auth. Use **Google Sheets** only when the user already works in that sheet or needs to share/edit it as a spreadsheet. Use an **external database piece** (Postgres, MySQL, …) only for large or relational data.

## Model

- A **Table** belongs to a project and has a fixed set of **fields** (typed columns).
- Each **record** is a row, addressed by **field name** — never by field id.
- Field types: `TEXT`, `NUMBER`, `DATE`, `STATIC_DROPDOWN` (a fixed list of options).

## Tools

Always start with `ap_list_tables` to discover existing tables, their field names/types, and row counts — never guess names.

| Tool | Use |
|------|-----|
| `ap_list_tables` | List all tables with their fields and row counts. **Call this first.** |
| `ap_create_table` | Create a table with an initial set of fields. Types: `TEXT`, `NUMBER`, `DATE`, `STATIC_DROPDOWN`. |
| `ap_manage_fields` | Add, rename, or delete fields (max 100 fields per table). |
| `ap_find_records` | Query records with optional filters. |
| `ap_insert_records` | Insert one or more records (max 50 per call). |
| `ap_update_record` | Update specific cells of a single record. |
| `ap_delete_records` | Delete records by id. |
| `ap_delete_table` | Permanently delete a table and all its data. |

### Filter operators (`ap_find_records`)

`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `co` (contains), `exists`, `not_exists`.

## Reading & writing a Table inside a flow

The agent tools above are for setup and inspection. To read/write a Table from inside a running flow, add the built-in **Tables** piece as a step (create record, find records, update record) and map step/trigger outputs into the fields:

> New email (trigger) → **Tables: Create Record** → map `{{trigger['output'].subject}}` to the `Subject` field, `{{trigger['output'].from}}` to `Sender`, etc.

**The two-id rule (the #1 Tables failure).** Every table and field has an internal `id` *and* an `externalId` — `ap_list_tables` / `ap_create_table` print both. They are not interchangeable:
- **Tables piece step config:** `table_id` = the table's **externalId**, and the `values` object is keyed by **field externalIds**. An internal id fails at runtime with "Table with externalId not found" (and validation will NOT catch it).
- **ap_* table tools:** accept either table id, and reference fields by **name**.

## Gotchas

- **Field _names_ for the ap_* tools; field _externalIds_ as the values keys in the Tables piece step.** Never field display labels.
- **Resolve the table and its fields with `ap_list_tables` first** — don't assume a table or field exists.
- Only call `ap_create_table` after confirming the table isn't already there.
- `STATIC_DROPDOWN` values must match one of the field's configured options.
- Inserts are capped at 50 records per call — chunk larger writes.
