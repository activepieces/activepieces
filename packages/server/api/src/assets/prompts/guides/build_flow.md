# Guide: Build an automation

Load this right before you build, after discovery is done and the needed connections are selected.

Open with ONE thinking-status that frames the whole build in a warm sentence — e.g. "I'll wire up the trigger, connect the apps, and double-check it satisfies your goal before handing it over." Then work silently (no visible text until done).

## Order of work (no visible text until ALL steps are done)
- **Simple flows** (linear, no branches/loops): `ap_build_flow` → validate every step (below) → `ap_test_flow` → reflect (below) → `ap_manage_notes`.
- **Flows with loops**: `ap_build_flow` supports nesting. For steps inside a loop, set `parentStepName` to the loop step's name and `stepLocationRelativeToParent` to `INSIDE_LOOP`. Steps that omit `parentStepName` are placed after the last top-level step (not inside the loop).
- **Complex flows** (branches, routers, many steps): `ap_create_flow` → configure trigger → validate → for each action: `ap_add_step` → validate → `ap_test_flow` → reflect → `ap_manage_notes`.
- Share the flow link. The flow is a draft — do NOT auto-publish.

**After `ap_build_flow`** it creates the skeleton but does NOT validate configs or field mappings. You MUST: (1) `ap_validate_step_config` on the trigger and each step, (2) fix any errors with `ap_update_step`/`ap_update_trigger`, (3) `ap_validate_flow` to confirm all steps are valid.

## Reflect against the brief before sharing
Before you share the link, check the built flow against the discovery brief — this is where good becomes great. Re-read the brief's `what`, `why`, `constraints`, and `dataFindings`, and confirm each is actually satisfied:
- Does the starting event match what the user described?
- Is every constraint present as a real step or field (e.g. "only senior, EU-based" → an actual filter/condition, not skipped)?
- Are `dataFindings` columns mapped to real `value` IDs you resolved — not invented names?
- Does the output go where they wanted, in the form they wanted?
If anything is missing or contradicts the brief, fix it with `ap_update_step`/`ap_update_trigger`, re-validate, and only then share. Don't hand over a flow that quietly drops part of the goal.

**Done when**: flow created, all steps validated, reflected against the brief and gaps fixed, test passed (or noted), and link shared.

## Resolving field values
- STATIC_DROPDOWN: options are in piece metadata — use `value` (the ID) directly, never `label`, no API call needed.
- DROPDOWN: `ap_resolve_property_options` → use `value` (ID), never `label`.
- MULTI_SELECT_DROPDOWN: same as DROPDOWN but pass an **array** of IDs.
- DYNAMIC: `ap_get_piece_props` with the current input to resolve sub-fields.
- Resolve parent fields before children (e.g. Spreadsheet before Sheet).
- **Spreadsheet/table columns** are letter-based (A, B, C, … AA, AB), NOT header names. `ap_resolve_property_options` returns `{ label: "Email", value: "A" }` — always use `value` (the letter), never `label`. Applies to Google Sheets, Excel, any spreadsheet piece. Never infer column references from header names.
- **Chained dependent fields** (e.g. Spreadsheet → Sheet → Columns): use `ap_resolve_property_chain` to resolve the full chain in one call; pass known values as `selectedValue` to skip ahead.

## Auth wiring
- When building, you MUST pass the connection's `externalId` as the `auth` parameter on `ap_build_flow` steps, `ap_add_step`, `ap_update_step`, and `ap_update_trigger`. The system auto-wraps it — pass the raw `externalId` string. A connection the user selected via `ap_show_connection_picker` is their choice — use it.
- Step references: `{{stepName['output'].field}}` — output is nested under `['output']` (e.g. `{{trigger['output'].body.email}}`, `{{step_1['output'].id}}`). For a failed step's error when continue-on-failure is on, use `{{stepName['error'].message}}`.
- `custom_api_call`: relative URL only; auth injected from the connection.

## Discipline while building
- After every step mutation (`ap_add_step`, `ap_update_step`, `ap_update_trigger`), immediately `ap_validate_step_config` on that step. Fix and re-validate if it fails.
- **Never guess property names** — the exact names come from `ap_get_piece_props`. If a step fails with "Unknown properties", call `ap_get_piece_props` and retry with the correct names.
- **Fill all fields by default** when writing to a spreadsheet or table — fill ALL columns unless the user said otherwise; use an empty value or "Not found" rather than omitting a column.
- **Prefer batch actions** — use the multiple-rows variant (`update-multiple-rows`, `insert-multiple-rows`) over per-row calls.
- **Verify writes with read-back**: after a create/update step in a test, read the record back and compare every field before reporting success. If fields are missing/different, report and offer to fix; after one failed retry, report and stop.
- **Diagnose before switching approach** on failure: check property names (`ap_get_piece_props`), `value` vs `label` for dropdowns, the `auth` externalId, and step-reference format. Fix the specific issue and retry. Never abandon the piece for raw JSON/API calls unless the piece genuinely can't do it. Never ask the user for JSON.
- **Replan instead of looping.** After 2 consecutive failed fixes on the SAME step, stop repeating variations — re-read the brief and `ap_get_piece_props`, reconsider whether the chosen app/action is even right, then try ONE structurally different approach. If that also fails, report honestly what's blocking and ask the user how they'd like to proceed. Never re-issue near-identical fixes more than twice.

## Worked examples (the bar to clear)
- **Recovery, not flailing:** `ap_add_step` for "Create row" fails with "Unknown properties: sheet". You DON'T switch to raw HTTP or ask the user for JSON — you call `ap_get_piece_props`, see the field is `spreadsheet_id` + `sheet_id`, resolve them with `ap_resolve_property_options`, fix the step, re-validate. Clean.
- **Reflection catches a dropped constraint:** the brief says "only flag candidates with ≥5 years". Your first pass built trigger → score → notify, with no filter. Your pre-share reflection catches that "≥5 years" never became a step, so you add a condition before the notify, re-validate, *then* share — instead of handing over a flow that scores everyone.

## Converting a one-time task into a recurring automation
1. Ensure the one-time task's project is selected via `ap_select_project`.
2. Pick the starting event: new/incoming items → app trigger if available; periodic → Schedule; ambiguous → default to once and ask "Would you like this to run once, or repeat automatically?".
3. Reuse the same app, action, connection, and inputs from the one-time task.
4. Build per this guide.
