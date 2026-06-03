# Building flows in Activepieces

Read this before building. It covers the build loop and the cross-cutting rules that prevent the most common failures. For specific areas, read the other guides via `ap_get_guide`: `patterns`, `control-flow`, `state`, `tables`, `ai`, `error-handling`.

A **flow** is a `trigger` (what starts it) followed by ordered **steps** (actions, routers, loops, code). You build it by calling tools, validating, testing, then publishing.

## The build loop

1. **Discover — never guess.** `ap_research_pieces` to find the right piece + its actions/triggers. `ap_list_connections` for available auth. `ap_list_ai_models` for AI. `ap_list_tables` for existing data. Confirm names exist before using them.
2. **Plan the shape** before creating anything: trigger → steps in order → end state. If it has branches, loops, or state, read `ap_get_guide(patterns)` and sketch it first — rebuilding a mis-shaped flow costs more than planning it.
3. **Build.**
   - **Simple linear flow** (no branches/loops): `ap_build_flow` creates trigger + steps in one call.
   - **Complex flow** (branches, loops, nesting): `ap_create_flow` → `ap_update_trigger` → `ap_add_step` per step, so you control structure.
4. **Validate after every mutation.** `ap_build_flow` builds the skeleton but does **not** check field mappings. After each `ap_add_step` / `ap_update_step` / `ap_update_trigger`, call `ap_validate_step_config` on that step, fix any errors, then continue. Finish with `ap_validate_flow` for the whole flow.
5. **Test.** `ap_test_step` on each step as you go — this both catches schema mistakes early **and populates that step's sample data, which the next step's `{{...}}` references resolve against.** Use `ap_test_flow` for an end-to-end run. **Loops only execute under `ap_test_flow`** — `ap_test_step` does not re-run loop bodies.
6. **Publish (only when asked).** `ap_lock_and_publish` then `ap_change_flow_status` to enable. Otherwise leave the flow in draft and share the link.

## Step references — flat, no `.output.`

Reference a previous step's data with `{{stepName.field}}`:

```
{{trigger.body.email}}                  ✓
{{step_1.id}}                           ✓
{{step_2.choices[0].message.content}}   ✓  (array indexing + deep paths are fine)
{{step_4}}                              ✓  (a step that returns a raw scalar)

{{step_1.output.id}}                    ✗  no ".output."
{{steps.step_1.id}}                     ✗  no "steps."
{{$step_1.id}}                          ✗  no "$"
```

**Verify the real output shape with `ap_test_step` before referencing it — never assume field names.** Some steps return a raw value, not an object: `store/get` and `ai`'s *Ask AI* / *Classify Text* return a bare string, so reference `{{step_1}}`, not `{{step_1.value}}` or `{{step_1.text}}`. (See `ap_get_guide(ai)`.)

## Step naming

The trigger is always `trigger`. Actions are `step_1`, `step_2`, … numbered in **insertion order**, not canvas/visual order. Call `ap_flow_structure` to see the real names and the step tree.

## Auth — pass the externalId, the platform wraps it

`ap_list_connections` → take the connection's `externalId` → pass it verbatim as the `auth` argument on `ap_add_step` / `ap_update_step` / `ap_update_trigger`. **Do not** pre-wrap it as `{{connections[...]}}` — that wrapping is done for you. If no connection exists, point the user to `ap_setup_guide`; don't invent credentials.

## Choosing pieces — prefer a native piece over raw HTTP

- Find pieces with `ap_research_pieces` (fuzzy `searchQuery`, or exact `pieceNames` for bulk lookup). Use the **full** piece name (e.g. `@activepieces/piece-slack`) for `ap_add_step` / `ap_update_trigger`.
- Reach for the native piece/action before `custom_api_call` or the HTTP piece. Only fall back to HTTP when no native action fits — then use a relative URL and the connection's auth.
- Before configuring a step, `ap_get_piece_props` to get exact field names/types. For dropdowns, `ap_resolve_property_options` and use the option's **`value`/id, never its label**. Resolve parent fields before dependent children (e.g. spreadsheet before sheet).

## Hard limits to design around

Activepieces' documented limits — plan within them:

| Limit | Value | Consequence if exceeded |
|---|---|---|
| Flow runtime | **600 s** active execution (Wait / Delay / Approval pauses do **not** count) | Run times out and halts |
| Memory | ~1 GB RAM | Run crashes |
| Run log | ~25 MB total step inputs+outputs | Run truncates/fails |
| Webhook sync response | 30 s | Caller gets a timeout |
| Webhook payload | 5 MB | Larger payloads rejected |
| Store value | 512 KB per key (128-char key) | Use Tables for bigger data |

Design consequences: a loop over thousands of items will blow 600 s — chunk it or split into sub-flows (`ap_get_guide(error-handling)`). Capturing full payloads across many iterations blows the 25 MB log — strip what you don't need. Hold large files by reference/URL, not inline base64.

## Don't (the recurring mistakes)

- **Don't delete+recreate a step to edit it** — that destroys its sample data. Use `ap_update_step` (provide only the fields you're changing).
- **Don't assume an AI step returns an object** — *Ask AI* / *Classify Text* return raw strings; only structured actions like *Extract Structured Data* return objects.
- **Don't reference sibling steps from inside a loop body** — only the loop's own iteration data is in scope there.
- **Don't call `ap_test_step` on a loop** expecting iterations — use `ap_test_flow`.
- **Don't mark a flow "done" with required fields empty or untested** — validate and test first.
