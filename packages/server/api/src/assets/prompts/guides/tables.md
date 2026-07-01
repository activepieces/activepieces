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

Tables belong to a project, so a project must be selected before you create or write one — if none is selected yet, call `ap_select_project` first. Always start with `ap_list_tables` to discover existing tables, their field names/types, and row counts — never guess names. Create tables directly with `ap_create_table`; never fall back to raw HTTP / `/api/v1/tables` and never ship a placeholder table id.

| Tool | Use |
|------|-----|
| `ap_list_tables` | List all tables with their fields and row counts. **Call this first.** |
| `ap_create_table` | Create a table with an initial set of fields. Types: `TEXT`, `NUMBER`, `DATE`, `STATIC_DROPDOWN`. |
| `ap_manage_fields` | Add, rename, or delete fields (max 100 fields per table). |
| `ap_find_records` | Query records with optional filters. |
| `ap_insert_records` | Insert rows — pass an array (max 250 per call). The result reports the running table total so you can verify the count. The ONLY way to add rows. |
| `ap_update_record` | Update specific cells of a **single** record (by id). |
| `ap_update_records` | Set the same field value(s) on **many** records at once — pass the full `recordIds` array + one `fields` object. The bulk path for "set these to X", "update rows 2–5", "mark the selected ones". For different values per row, use separate `ap_update_record` calls. |
| `ap_delete_records` | Delete rows by **id** (pass the whole id array in one call, no cap) OR by **filters** (pass `tableId` + `filters` to delete every match server-side, no id-fetch). Always pass `tableId` so an open Stage shows the deletions live. Deletes are **reversible** — the result returns the deleted ids; restore them with `ap_restore_records`. |
| `ap_restore_records` | Undo a delete — restore rows by id (the ids returned by the `ap_delete_records` call you want to reverse). |
| `ap_clear_table` | Empty a table — delete EVERY row in one fast call, keeping the table/fields. Use for "clear / empty / reset the table". |
| `ap_delete_table` | Permanently delete a table and all its data. |

### Filter operators (`ap_find_records`)

`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `co` (contains), `exists`, `not_exists`.

## Which rows the user means (resolve, don't ask)

Every write tool targets rows by **record id**. The user thinks in the grid in front of them — selected rows, "these", "rows 2–5", "all of them". Map their words to ids in this order, then act. This is reversible work on what's on their screen: **never ask "which rows?"** — resolve and go.

1. **Selection / "these" / "them" / "the selected ones".** When a Table is open, the "Active context" note carries the user's current selection as explicit **record ids** (the focus's `record ids: …` and the `[id …]` tag on each excerpt row). Use those ids directly — that IS what "these" points at. No `ap_find_records`, no value-matching.
2. **Positional — "rows 2–5", "the first 5", "the last row".** The excerpt rows are numbered `1, 2, 3…` exactly as the grid shows them, each with its `[id …]`. Read the ids for those positions straight from the excerpt. Only fall back to `ap_find_records` when the referenced rows are **beyond the excerpt window** (it shows the first ~15 rows). Never count records returned by `ap_find_records` as if they were grid positions — its order need not match the grid.
3. **A bare value is an edit, not a question — "these are devtools".** Read it as *set the obvious column on the rows in play to that value* (here: `Category` = `DevTools` on the selected rows). When one column obviously fits, don't ask which column — set it. Use `ap_update_records` with the selected ids in one call.
4. **"all" / "the rest" mid-conversation = the established working set**, i.e. all the rows already in play (the current selection/range, or the ones you were just working on) — **not** the whole table. Reserve the whole table only for an explicit "every row" / "the whole table" / "all rows in the table". (For emptying the whole table, that's `ap_clear_table`.)

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
- **Never read or write a Table with `ap_run_code`/`fetch`.** The sandbox can't reach the AP API. Use the `ap_*` table tools for every read/write. (Using `ap_run_code` to *generate* the row data, then handing that array to `ap_insert_records`, is fine — only the write must be native.)
- **Size the batches to the job (see `<heavy_work>`).** A turn has a limited step budget (~50 tool calls), so match the chunk size to the volume:
  - *Small adds* (≲50 rows): a couple of modest waves (~10–20 per call) so the open Stage visibly fills in bursts rather than one delayed dump.
  - *Large adds* (hundreds–thousands): insert in **full batches of up to 250** so the whole job fits the step budget — 1,000 rows = ~4 calls, not 100. Chunk via **repeated `ap_insert_records` calls**, never a code/fetch loop.
  - Tables cap at **10,000 rows**; if asked for more, fill to the cap and say so.
- **For bulk/synthetic data ("add N test rows"), generate the array with `ap_run_code` (~2s) and pass it to `ap_insert_records`** — far faster than hand-typing every row, which makes the user wait while you generate tokens. Generate, then insert in big batches.
- **Verify the count, never assume it.** `ap_insert_records` returns the running table total — report that real number, not the number you meant to add. After a large fill, the total (or `ap_list_tables` rowCount) is your proof.
- **To empty or trim a table, don't loop.** "Clear / empty / reset" → one `ap_clear_table`. "Delete the rows where X" → one `ap_delete_records` with `filters` (deletes all matches server-side, no 500-row paging). Only fall back to id-based `ap_delete_records` for a specific handful you already have ids for. Never page `ap_find_records` → `ap_delete_records` in a loop to clear a table.
- **Positional / ordinal / count-based selections have NO filter form.** "delete rows 9–12", "delete the first 5", "delete the last row", "delete every other row" do not map to any `filters` — resolve them to record ids per **Which rows the user means** above (selection/excerpt first, `ap_find_records` only for rows beyond the excerpt window), then pass `recordIds`. NEVER approximate a positional or count-based request with a filter.
- **A filter must encode the user's actual stated condition — never a catch-all.** An `exists` / `not_exists` filter on an always-populated field matches the **whole table**, which is the same as `ap_clear_table`, not "some rows". `ap_delete_records` will **reject** a filter that matches every row. If you're unsure how many rows a filter hits, run `ap_find_records` with that filter first and read the count before deleting.
- **A wrong delete is recoverable.** `ap_delete_records` returns the deleted ids; if you (or the user) realize the delete was a mistake, call `ap_restore_records` with those ids to bring the rows back exactly as they were.
