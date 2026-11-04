# Guide: Build an automation

## The build path
1. **Discover** (discovery's guide arrives with this skill, so don't load it separately): infer the business logic (categories, routing, thresholds, destinations, wording) from their company, their real data (`ap_explore_data`) and market practice. Don't ask the user for it; every assumption becomes an editable line in the closing brief. If the flow is recurring and reads persistent data, decide now how run N+1 avoids reprocessing run N.
2. **Research:** `ap_research_pieces({pieceNames, forIntent})` for the apps (missing app → `http_fallback` skill), pick from `recommendedActions`, then ONE `ap_get_piece_props` call with the trigger and every action as `items` (each with its `auth` when the app needs one). It resolves dropdowns and returns each one's `requiredInputs`, a ready `exampleInput`, its output fields, each trigger's sample payload, and the project's connections for every app, so skip `ap_list_connections` / `ap_discover_action_auth`. Never call it once per action.
3. **Handoff:** one-line recap, make sure each app has a connection the user picked (`ap_show_connection_picker`, one card per app still missing one, all in one reply), choose sensible defaults, and only ask (`ap_show_questions`) about a single make-or-break choice you truly can't infer.
4. **Build** (below), **validate**, **reflect**, then share the link and offer a test and "Turn it on?".

Most flows are 2–5 linear steps. Add routers, loops or stored state only when the goal needs them (`control_flow`, `state` skills). Reprocessing safety on a recurring flow is never optional: load `build_flow_advanced` for dedup patterns, formulas and runtime limits. Existing flows (inspect, rename, pause, delete) are in `flow_management`.

## The build card
Right after loading this skill, for every brand-new automation, whatever starts it (a schedule, an event, a webhook, a form or a manual trigger), and never for one-time tasks, lookups or edits to an existing flow, call `ap_set_build_plan` (silent, no thinking status) with `phase: 'detecting'`, a short `flowName`, a bold `tagline` about the exact busywork it kills (about 7 words, no period, e.g. "No more chasing invoices by hand"), a fitting `iconName` (`mail`, `dollar-sign`, `users`, `calendar`, `bot`, `bar-chart`, `package`, `message-square`…) and every step as `pending`. The card is the progress, so don't narrate each step in text.
- Keep the same `tagline`, `iconName` and step `id`s on every update so the card updates in place.
- Send each update alongside the next step's real tool calls; a step that only updates the card costs a full round trip. Batch only states you already know: a step's `done`/`failed` and `phase: 'done'`/`'failed'` go out after the result that decides them has come back, never in the same step as the call that produces it (the final `done` can ride with your closing step).
- Once a flow is built, the card's rows switch to its real steps (one row per flow for a solution) and tick themselves off from the build and edit results. You only move the `phase` (`testing`, `done`, `failed`).
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
- **Every new flow, including loops and conditions:** one `ap_build_flow` call. Steps inside a loop: `parentStepName` = the loop, `stepLocationRelativeToParent: 'INSIDE_LOOP'`. A condition is a `ROUTER` step with its `branches` and their conditions (an "Otherwise" fallback is added last); the first step of each branch goes `INSIDE_BRANCH` with the router as parent and its `branchIndex`, and the rest of that branch goes `AFTER` the previous step in it. `parentStepName` can be an earlier step's displayName from the same call.
- **Changing an existing flow:** never a rebuild. More than one edit → ONE `ap_apply_flow_operations` call (`operations: [{type: 'update_step' | 'add_step' | 'delete_step' | 'update_trigger' | 'add_branch' | 'update_branch' | 'delete_branch', ...that tool's fields}]`). It is all-or-nothing: if one fails nothing is applied, so fix it and resend the whole list, then fix the remaining problems it lists. One edit → the single tool.
- `ap_build_flow` validates what it builds: its reply lists each step and every remaining problem as `step.field: message`. Fix them all in one pass (`ap_apply_flow_operations`, or `ap_update_step` / `ap_update_trigger` for one). Don't call `ap_validate_step_config` / `ap_validate_flow` after it; use `ap_validate_flow` only after later edits or before publishing.
- Dropdown inputs may take the option label the user said ("#general", "Sales"): a clear match is replaced by its value, otherwise the reply lists candidates.

## Field values and wiring
- Use dropdown `value` (the ID), never `label`. Multi-select takes an array of IDs. Resolve dependent chains (spreadsheet → sheet → column) with ONE `ap_resolve_property_chain` call: give every field in the chain a `selectedValue` you know or a `match` with the name the user used ("Leads", "Sales"). It picks the clear match (or the only option) at each level and continues, and stops only where nothing or several things match. Never resolve a chain one field per call.
- Spreadsheet columns are letters (A, B, … AA), never header names.
- Pass the connection's raw `externalId` as `auth` on every build call. Reference outputs as `{{step_1['output'].field}}` (a failed step's error: `{{step_1['error'].message}}`); use the output paths `ap_get_piece_props` lists.
- Map only the fields a step needs, never a whole upstream object; large values go by URL/reference.
- When you change a step's data source, re-resolve its fields and re-map every downstream reference.
- Never guess property names; if a step is rejected with "Unknown properties", call `ap_get_piece_props` and retry. `custom_api_call` takes a relative URL.
- Fill every column when writing to a sheet or table; prefer batch actions over per-row calls.

## Check it, then offer a test
Valid is not working: a step can succeed with empty or wrong data, so check the wiring before you hand it over.
1. Fix every problem `ap_build_flow` (or `ap_validate_flow` after later edits) lists, in one round. Make sure each `{{…}}` points at a field the earlier step's output fields or sample output really has.
2. Don't run a live test on your own: tests run the real actions (send the message, write the row, label the mail). Run `ap_test_flow` only when the user asks for a test, or when every step only reads. Otherwise offer it as a quick reply next to "Turn it on" (e.g. "Test it with a sample order").
3. When you test, use realistic, safe data and check the output, not the status (`ap_get_run`): every `{{…}}` resolved to real data and the result matches the goal. Fix and re-run at most twice. A failure from outside the flow (connection, quota, the other service) is reported, not retried.
4. A recurring flow over persistent data, when tested: run it twice on the same state. Run 2 must not redo run 1's work.
5. Mock trigger data proves the steps, not the live trigger. Say so, and ask the user to confirm with one real event.
After 2 failed fixes on the same step, step back and try one structurally different approach; if that fails, say what's blocking and ask.

## Reflect, show, brief
Before sharing, re-read the request: right trigger, every constraint present as a real step or filter, real field IDs, output where they wanted it, and (if recurring) an actual anti-reprocessing step. Fix gaps first.
If you tested, show each case as one line, `input → what the flow produced`. Share the link and close with the brief: the assumptions you made (each editable) and the obvious next improvements, with quick-reply chips for the top one or two.

## Several jobs: a solution of small flows in one folder
List the jobs in the request first: intake, processing, storage, reporting, approval, alerting. One job is one flow. Two or more jobs, or a job several flows need, is a **solution**: a folder of small flows, one job each, joined by subflows and Tables. Do this without being asked; one big flow breaks everywhere at once and hides which part failed.
- Example: "when an order comes in by webhook, save it, and send me a daily summary" is **Receive orders** (webhook → Call Flow), **Save order** (Callable Flow → Tables create) and **Daily order summary** (schedule → Tables find → message), in an `Order intake` folder with an `Orders` table.
- Work shared by several entry points (a webhook and a form, two schedules) goes in ONE Callable subflow that each entry flow calls. Never copy the same steps into two flows.

How to build one:
1. **Folder:** `ap_create_folder` with a name for the whole solution; pass that `folderName` to every `ap_build_flow` and `ap_create_table` in it.
2. **Names:** each flow named for its one job in plain words ("Save order", never "Flow 2").
3. **Order:** tables, then every flow that needs nothing else built first (a shared subflow, a digest that only reads a table) in one step with parallel `ap_build_flow` calls, then the flows that call them, given the ids the first ones returned. Build the flows yourself, not through tasks: a task repeats your setup for each flow and costs about twice as much.
4. **Subflow:** trigger `@activepieces/piece-subflows` `callableFlow` with `exampleData.sampleData` listing every input, e.g. `{"orderId": "123", "email": "a@b.co"}`. Its steps read inputs as `{{trigger['output'].data.<key>}}`, never `{{trigger['output'].<key>}}` (empty at run time). Add `returnResponse` only if a caller needs data back.
5. **Caller:** a `callFlow` step with `flowId` = the subflow's **externalId** (from `ap_build_flow`, not its flow id), `mode: "simple"`, every sample-data key in `flowProps.payload` as an object, and `waitForResponse` only when the subflow returns a response.
6. **Tables steps:** `table_id` is the table's **externalId**; form `values` are keyed by field externalId.
7. **Check the whole solution:** once every flow passes its own checks, run `ap_validate_flow({folderName})` and fix what it lists until it returns ✅. Use it too to check an existing solution.
8. **Build card:** one for the whole solution: `flowName` is the solution name, one step per flow and table, `flowId` the entry flow.

Testing: a Call Flow only reaches a published subflow, so a caller's test fails at that step while the subflow is a draft. Test each subflow on its own with `ap_test_flow` and trigger data shaped `{"data": <its sample data>}`, and test the caller's steps before the Call Flow.
Turning it on: one "Turn it on?" card for the whole solution; on yes, publish the subflows first and their callers last.

## Turn it on?
Chat never publishes on its own. End every validated flow with one quick-reply card, "Turn it on?" ("Turn it on" / "Test it first" / "Not yet"); "Test it first" runs one realistic test, then asks again. Only a yes calls `ap_lock_and_publish({flowId})`. Never call a flow live, running or active unless publish succeeded; until then it's "a draft, not running yet". For other flows, report the status the tools show.

## Turning a one-time task into a recurring flow
Reuse the same project, app, action, connection and inputs. Pick the trigger (new items → the app's trigger; periodic → Schedule; unclear → ask "once or automatically?"; the exact phrase "Run this automatically every day" means a daily Schedule, no question). If it reads persistent data, add reprocessing protection now. Then build per this guide.
