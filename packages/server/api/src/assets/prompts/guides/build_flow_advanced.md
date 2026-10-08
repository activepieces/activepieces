# Guide: Advanced flow building

Load this when a flow must not reprocess data, needs a formula instead of code, or loops over many items.

## Recurring flows must not reprocess
**Before you build, answer one question: does this run more than once, and does it read data that persists between runs?** If a scheduled/recurring flow reads a source that keeps its data (a sheet, a Table, an inbox, any record set), that source holds the SAME rows again on the next run. A flow shaped `read-all → act → done` will redo run N's work on run N+1 — re-sending, re-paying, re-notifying. This is the #1 silent logic bug: it validates fine, a single test run looks perfect, and the damage only appears on the second run.

Worked failure: "summarize each employee's hours from my sheet and tell me what to pay them", on a weekly schedule. `read sheet → summarize → email` is correct for ONE week — but nothing marks anyone paid, so every week it re-pays everyone for hours already paid. Correct flow for the wrong problem. The fix below (Activepieces Tables ledger): read the sheet → drop rows whose key is already in a `Paid Log` table → pay only the new ones → record their keys in `Paid Log`.

If the flow is recurring AND reads persistent data, commit to exactly ONE of these (each maps to a primitive the platform already has — don't hand-roll):
- **A "new item" trigger that dedups for you** — prefer this when the source HAS such a trigger. Use its *New Record / New Row / New Email* trigger (Tables **New Record** is a real webhook; app polling triggers dedup via `lastPoll`/`lastItem`) instead of a schedule + a stateless "get all rows" read. The trigger fires once per new item and never re-sees old ones. (`ap_load_skill('tables')` / the app's triggers.)
- **An Activepieces Tables ledger (dedup against a table you own)** — the default when the source is external or read-only (a Google Sheet, an inbox) and you should NOT mutate it, or when there's no new-item trigger. Create an AP Table (e.g. `Paid Log`, `Processed Orders`) that records the keys you've already handled. Each run: (1) read the source; (2) build a **stable dedup key** per item (e.g. `worker + shift date`, `order_id`, `message_id`); (3) `find-records` the ledger and keep only items whose key is NOT already there; (4) act on just those new items; (5) `create-records` their keys into the ledger so the next run skips them. This syncs "what's been done" into Activepieces and makes the flow idempotent without touching the user's source. `ap_load_skill('tables')`.
- **A processed-flag filter + write-back** — when you DO own the source: read only unprocessed rows (`find-records`/"get rows" filtered on e.g. `status = pending` or `paid = false`), then after acting flip that field with `update-record`/update-row. Without the write-back the filter is meaningless.
- **Delete or archive after processing** — remove/move the row once handled so the next read can't see it.
- **A stored high-water mark** — persist the last-processed id/timestamp in **Store** (`ap_load_skill('state')`) and filter the read to items newer than it.

Also reason through the rest of the cleanup surface, not just the happy path: a **stable dedup key** (so the same real-world item isn't counted as new after an edit), **partial-run recovery** (only mark an item done AFTER its action succeeds, so a mid-run crash reprocesses just the unfinished ones — put the mark/record step immediately after the action), and **ledger growth** (a dedup table grows forever — prune or archive old keys on a retention window if volume is high). Match the depth to the real volume; don't build a retention job for a table that gains 5 rows a week.

Skipping this on a recurring-over-persistent-data flow is not allowed. If you genuinely can't determine a safe mechanism, that's one of the rare cases to ask the user via `ap_show_questions`.

## CODE is the last resort — use inline expressions & conditions first
Dropping a **CODE step** into a flow to filter, reshape, calculate, or format data is almost always the wrong first move — it's slower to build, opaque to a non-coder, and harder to debug. Walk this ladder and stop at the first rung that fits; only the last rung is code:
1. **A native piece action** — anything that talks to an app or is a normal automation step.
2. **A router condition** (`ROUTER`; `ap_load_skill('control_flow')`) — to *route/branch* on a value, using the structured `BranchOperator`s.
3. **An inline formula expression** — to *derive, filter, format, or calculate* a value right inside a step's input. No extra step, runs instantly, and covers the large majority of "I'll just write a quick CODE step to massage this" cases.
4. **A CODE step** — ONLY when none of the above fit: genuinely procedural multi-step logic, parsing the functions can't express, or a real npm library is needed.

### Writing an inline formula expression
Put it directly in a step's input value, wrapped EXACTLY like this (the wrapper is what makes it evaluate as a formula instead of a literal string):
`ap-formula-v1::{ <expression> }::ap-formula-v1`
Inside: call functions with `;`-separated args, double-quote string literals, and reference earlier steps with the normal `{{step['output'].field}}` syntax. Real examples:
- Keep only open tickets → `ap-formula-v1::{filter_list({{trigger['output'].tickets}};"status";"open")}::ap-formula-v1`
- Count rows → `ap-formula-v1::{count({{step_1['output'].rows}})}::ap-formula-v1`
- Every email on one line → `ap-formula-v1::{join_list(pluck({{step_1['output'].users}};"email");", ")}::ap-formula-v1`
- Sum a column → `ap-formula-v1::{sum({{step_1['output'].orders}};"amount")}::ap-formula-v1`
- Label by threshold → `ap-formula-v1::{if({{step_1['output'].amount}} > 1000;"High value";"Standard")}::ap-formula-v1`
- Format money / clean text → `ap-formula-v1::{format_currency({{step_1['output'].total}};"$")}::ap-formula-v1`, `ap-formula-v1::{titlecase({{trigger['output'].name}})}::ap-formula-v1`

**Where formulas go:** use them in **free-text / value** inputs (a Store value, a message or email body, a field you type into). Do NOT put a formula in a **dropdown, connection, or option-picker** field — those need a resolved option id/value, and a formula string will fail validation.

### The function vocabulary (~100 built-ins; args separated by `;`; for numeric comparisons use `>` `<` `>=` `<=`, and the `is_equal` function for equality — not a bare `=`)
- **List** (reshape/filter — these replace most CODE steps): `filter_list(list;field;value)` · `sort_list(list;field;order)` · `pluck(list;field)` · `join_list(list;sep)` · `count(list)` · `sum(list;field)` · `average(list;field)` · `min_in_list`/`max_in_list(list;field)` · `deduplicate(list;field)` · `first_item`/`last_item(list)` · `item_at(list;i)` · `contains_item(list;value)` · `flatten(list)` · `reverse_list(list)` · `split_text_to_list(text;sep)`
- **Logic**: `if(cond;then;else)` · `switch(value;k1;r1;…)` · `coalesce(a;b;…)` · `if_empty`/`if_null(value;fallback)` · `is_empty`/`is_not_empty(value)` · `is_equal(a;b)` · `and`/`or(a;b)` · `not(x)`
- **Text**: `combine` · `uppercase`/`lowercase`/`titlecase` · `trim` · `replace(text;find;with)` · `split(text;sep;i)` · `contains(text;value)` · `starts_with`/`ends_with` · `extract_email`/`extract_url` · `truncate(text;n)` · `slug` · `length`
- **Number**: `add`/`subtract`/`multiply`/`divide` · `round(n;decimals)` · `round_up`/`round_down` · `min`/`max` · `percentage(v;total)` · `format_number(n;decimals)` · `format_currency(n;symbol)` · `to_number` · `absolute` · `modulo`
- **Date**: `format_date(date;fmt)` · `format_time` · `relative_time` · `add_days`/`subtract_days(date;n)` · `add_hours`/`add_minutes` · `days_between`/`hours_between` · `is_before`/`is_after`/`is_same_day` · `now()` · `today()` · `to_date(text)` · `start_of_day`/`end_of_day` · `start_of_month`/`end_of_month` · `get_year`/`get_month`/`get_day`/`get_day_of_week`

Validate a formula input with `ap_validate_step_config` like any step, and confirm the resolved value with `ap_test_step`/`ap_test_flow` — a wrong field name resolves to empty, exactly like a `{{...}}` reference does.

## Hard limits to design around
| Limit | Value | If exceeded |
|---|---|---|
| Flow runtime | **600 s** active (Wait/Delay/Approval pauses don't count) | run times out |
| Run log | ~25 MB (step inputs+outputs) | run truncates/fails |
| Memory | ~1 GB | run crashes |
| Webhook payload | 5 MB | rejected |
| Store value | 512 KB/key | use Tables instead |

A loop over thousands of items will blow 600 s — chunk it or split into sub-flows (`ap_load_skill('error_handling')`). Don't capture full payloads across many iterations (25 MB log). Hold large files by URL/reference, never inline base64.
