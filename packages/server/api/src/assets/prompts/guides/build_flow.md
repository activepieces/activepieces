# Guide: Build an automation

## The build path
1. **Discover** with the `discovery` skill: infer the business logic (categories, routing, thresholds, destinations, wording) from their company, their real data (`ap_explore_data`) and market practice. Don't ask the user for it; every assumption becomes an editable line in the closing brief. If the flow is recurring and reads persistent data, decide now how run N+1 avoids reprocessing run N.
2. **Research:** `ap_research_pieces({pieceNames, forIntent})` for the apps (missing app → `http_fallback` skill), pick from `recommendedActions`, then ONE `ap_get_piece_props({pieceName, actionName, auth})` per action. It resolves dropdowns and returns `requiredInputs` plus a ready `exampleInput`. Fire independent calls together in one step.
3. **Handoff:** one-line recap, make sure each app has a connection the user picked (`ap_show_connection_picker`), choose sensible defaults, and only ask (`ap_show_questions`) about a single make-or-break choice you truly can't infer.
4. **Build** (below), **validate**, **test**, **reflect**, then share the link and ask "Turn it on?".

Most flows are 2–5 linear steps. Add routers, loops or stored state only when the goal needs them (`control_flow`, `state` skills). Reprocessing safety on a recurring flow is never optional: load `build_flow_advanced` for dedup patterns, formulas and runtime limits. Existing flows (inspect, rename, pause, delete) are in `flow_management`.

## The build card
Right after loading this skill, for a brand-new recurring automation only (never for one-time tasks, lookups or small edits), call `ap_set_build_plan` (silent, no thinking status) with `phase: 'detecting'`, a short `flowName`, a bold `tagline` about the exact busywork it kills (about 7 words, no period, e.g. "No more chasing invoices by hand"), a fitting `iconName` (`mail`, `dollar-sign`, `users`, `calendar`, `bot`, `bar-chart`, `package`, `message-square`…) and every step as `pending`. The card is the progress, so don't narrate each step in text.
- Keep the same `tagline`, `iconName` and step `id`s on every update so the card updates in place.
- Send each update in the same step as the work it reports, alongside that step's real tool calls. A step that only updates the card costs a full round trip.
- Set `flowId` as soon as the build returns it. One-shot builds: flip steps to `done`/`failed` as you validate them (`phase: 'building'`). Incremental builds: `in_progress` before adding a step, `done` after it validates.
- `phase: 'testing'` while testing, `phase: 'done'` with the `flowId` when verified (reveals Open / Test / Run), `phase: 'failed'` on a genuine give-up.

Open the build with ONE thinking status that frames the whole job; a short text line between phases is fine.

## Prefer built-in pieces (no connection)
Map generic words straight to these; registry search often misses them.

| User says | Piece |
|---|---|
| "a form" | `@activepieces/piece-forms` (Human Input) |
| "every day/hour" | `@activepieces/piece-schedule` |
| "fetch a URL / call an API" | `@activepieces/piece-http` (`http_fallback` skill) |
| "webhook" | `@activepieces/piece-webhook` |
| "save/track data here" | `@activepieces/piece-tables` (`tables` skill) |
| "remember/count/dedup" | `@activepieces/piece-store` (`state` skill) |
| "ask AI/classify/extract" | `@activepieces/piece-ai`, never a vendor AI piece (`ai` skill) |
| "human sign-off" / "wait" / "split work" | `piece-approval` / `piece-delay` / `piece-subflows` |

## Order of work
- **Simple or looped flows:** `ap_build_flow` (for steps inside a loop set `parentStepName` to the loop and `stepLocationRelativeToParent: 'INSIDE_LOOP'`).
- **Branches or many steps:** `ap_create_flow` → `ap_update_trigger` → `ap_add_step` per action.
- `ap_build_flow` does not validate: run `ap_validate_step_config` on the trigger and every step, fix with `ap_update_step`/`ap_update_trigger`, then `ap_validate_flow`. Validate again after every later mutation.

## Field values and wiring
- Use dropdown `value` (the ID), never `label`. Multi-select takes an array of IDs. Resolve parents before children, and dependent chains (spreadsheet → sheet → column) with ONE `ap_resolve_property_chain` call, never one call per field.
- Spreadsheet columns are letters (A, B, … AA), never header names.
- Pass the connection's raw `externalId` as `auth` on every build call. Reference outputs as `{{step_1['output'].field}}` (a failed step's error: `{{step_1['error'].message}}`); use the output paths `ap_get_piece_props` lists.
- Map only the fields a step needs, never a whole upstream object; large values go by URL/reference.
- When you change a step's data source, re-resolve its fields and re-map every downstream reference.
- Never guess property names; if a step is rejected with "Unknown properties", call `ap_get_piece_props` and retry. `custom_api_call` takes a relative URL.
- Fill every column when writing to a sheet or table; prefer batch actions over per-row calls.

## Test until it actually works
Valid is not working: a step can succeed with empty or wrong data.
1. Run 1–3 realistic cases (a typical one plus an edge case, real data from `ap_explore_data` when possible) with `ap_test_flow` and `triggerTestData`; `ap_test_step` for one suspect step. Tests run real actions, so use safe data.
2. Check the output, not the status (`ap_get_run`): every `{{…}}` resolved to real data and the result matches the goal. Fix and re-run until every case passes.
3. Recurring flow over persistent data: run it twice on the same state. Run 2 must not redo run 1's work; identical output is the reprocessing bug.
4. Mock trigger data proves the steps, not the live trigger. Say so, and ask the user to confirm with one real event.
After 2 failed fixes on the same step, step back and try one structurally different approach; if that fails, say what's blocking and ask.

## Reflect, show, brief
Before sharing, re-read the request: right trigger, every constraint present as a real step or filter, real field IDs, output where they wanted it, and (if recurring) an actual anti-reprocessing step. Fix gaps first.
Then show each tested case as one line, `input → what the flow produced`, share the link, and close with the brief: the assumptions you made (each editable) and the obvious next improvements, with quick-reply chips for the top one or two.

## Several jobs: a solution of small flows in one folder
List the jobs in the request first: intake, processing, storage, reporting, approval, alerting. One job is one flow. Two or more jobs, or a job several flows need, is a **solution**: a folder of small flows, one job each, joined by subflows and Tables. Do this without being asked; one big flow breaks everywhere at once and hides which part failed.
- Example: "when an order comes in by webhook, save it, and send me a daily summary" is **Receive orders** (webhook → Call Flow), **Save order** (Callable Flow → Tables create) and **Daily order summary** (schedule → Tables find → message), in an `Order intake` folder with an `Orders` table.
- Work shared by several entry points (a webhook and a form, two schedules) goes in ONE Callable subflow that each entry flow calls. Never copy the same steps into two flows.

How to build one:
1. **Folder:** `ap_create_folder` with a name for the whole solution; pass that `folderName` to every `ap_build_flow` and `ap_create_table` in it.
2. **Names:** each flow named for its one job in plain words ("Save order", never "Flow 2").
3. **Order:** tables, then subflows, then the flows that call them; each needs an id the previous one returned.
4. **Subflow:** trigger `@activepieces/piece-subflows` `callableFlow` with `exampleData.sampleData` listing every input, e.g. `{"orderId": "123", "email": "a@b.co"}`. Its steps read inputs as `{{trigger['output'].data.<key>}}`, never `{{trigger['output'].<key>}}` (empty at run time). Add `returnResponse` only if a caller needs data back.
5. **Caller:** a `callFlow` step with `flowId` = the subflow's **externalId** (from `ap_build_flow`, not its flow id), `mode: "simple"`, every sample-data key in `flowProps.payload` as an object, and `waitForResponse` only when the subflow returns a response.
6. **Tables steps:** `table_id` is the table's **externalId**; form `values` are keyed by field externalId.
7. **Check the whole solution:** once every flow passes its own checks, run `ap_validate_flow({folderName})` and fix what it lists until it returns ✅. Use it too to check an existing solution.
8. **Build card:** one for the whole solution: `flowName` is the solution name, one step per flow and table, `flowId` the entry flow.

Testing: a Call Flow only reaches a published subflow, so a caller's test fails at that step while the subflow is a draft. Test each subflow on its own with `ap_test_flow` and trigger data shaped `{"data": <its sample data>}`, and test the caller's steps before the Call Flow.
Turning it on: one "Turn it on?" card for the whole solution; on yes, publish the subflows first and their callers last.

## Turn it on?
Chat never publishes on its own. End every validated flow with one quick-reply card, "Turn it on?" ("Turn it on" / "Not yet"). Only a yes calls `ap_lock_and_publish({flowId})`. Never call a flow live, running or active unless publish succeeded; until then it's "a draft, not running yet". For other flows, report the status the tools show.

## Turning a one-time task into a recurring flow
Reuse the same project, app, action, connection and inputs. Pick the trigger (new items → the app's trigger; periodic → Schedule; unclear → ask "once or automatically?"; the exact phrase "Run this automatically every day" means a daily Schedule, no question). If it reads persistent data, add reprocessing protection now. Then build per this guide.
