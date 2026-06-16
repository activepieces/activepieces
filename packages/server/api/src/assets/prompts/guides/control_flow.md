# Control flow: routers & loops

Routers (branching) and loops need the **granular** build path (`ap_create_flow` → `ap_add_step`), not `ap_build_flow`. Place steps inside them with `ap_add_step`'s `stepLocationRelativeToParent`: `INSIDE_BRANCH` (router), `INSIDE_LOOP` (loop), or `INSIDE_ON_SUCCESS_BRANCH` / `INSIDE_ON_FAILURE_BRANCH` (a continue-on-failure step's error branches — see `ap_load_guide('error_handling')`); `AFTER` puts a step after the parent. The step types are `ROUTER` and `LOOP_ON_ITEMS`.

## Routers

A router evaluates branches top-down and runs the **first** one that matches; an `Otherwise` (fallback) branch catches the rest.

**Gotcha 1 — a new router is born with two branches.** `ap_add_step` with stepType `ROUTER` auto-creates a condition branch named `Branch 1` with **empty conditions**, plus the `Otherwise` fallback. That empty `Branch 1` fails validation ("empty branch") until you act on it. Build sequence:

1. `ap_add_step` (stepType `ROUTER`) → creates `Branch 1` (empty) + `Otherwise`.
2. Either fill `Branch 1` via `ap_update_branch`, or delete it (`ap_delete_branch` `branchIndex: 0`) and add real ones with `ap_add_branch`.
3. `ap_add_branch` for each further condition branch.
4. `ap_add_step` with `stepLocationRelativeToParent: INSIDE_BRANCH` + `branchIndex: N` for the steps in each branch.

**Gotcha 2 — `branchIndex` is 0-based** for placement. Condition branches sit before the trailing `Otherwise`.

**Gotcha 3 — `ap_delete_branch` cascades:** it deletes every step inside that branch. Save anything you need first.

### Condition operators (`BranchOperator`)

Verbatim, the only valid operators:

```
TEXT_CONTAINS              TEXT_DOES_NOT_CONTAIN
TEXT_EXACTLY_MATCHES       TEXT_DOES_NOT_EXACTLY_MATCH
TEXT_START_WITH            TEXT_DOES_NOT_START_WITH
TEXT_ENDS_WITH             TEXT_DOES_NOT_END_WITH
NUMBER_IS_GREATER_THAN     NUMBER_IS_LESS_THAN     NUMBER_IS_EQUAL_TO
BOOLEAN_IS_TRUE            BOOLEAN_IS_FALSE
DATE_IS_BEFORE             DATE_IS_EQUAL           DATE_IS_AFTER
LIST_CONTAINS              LIST_DOES_NOT_CONTAIN
LIST_IS_EMPTY              LIST_IS_NOT_EMPTY
EXISTS                     DOES_NOT_EXIST
```

Watch the exact spelling: it's `TEXT_START_WITH` (not `..._STARTS_WITH`), and there is **no** `NUMBER_IS_NOT_EQUAL_TO` (use `NUMBER_IS_GREATER_THAN`/`NUMBER_IS_LESS_THAN`, or negate with the fallback branch). Within a branch, conditions combine as AND inside a group and OR across groups — verify anything non-trivial with `ap_validate_flow`. Order branches most-specific first; lean on `Otherwise` as the safety net.

## Loops (`LOOP_ON_ITEMS`)

Configure it with the array to iterate; put the body steps inside with `INSIDE_LOOP`.

**Inside the loop body:**
- Current item: `{{loopStep['output'].item}}` (dot into it: `{{loopStep['output'].item.email}}`).
- Current index: `{{loopStep['output'].index}}`.

**Loop output after it finishes** is `{ item, index, iterations }`:
- `item` is the **last** iteration's item only — **not** an array of everything.
- `iterations` is an array, one entry per iteration, each a record of that iteration's step outputs.

So to use **all** results after the loop, read `{{loopStep['output'].iterations}}`, or have each iteration write to a Table/Store and read after the loop (the common "loop accumulator": `store/add_to_list` inside, `store/get` after — see `ap_load_guide('state')`). Don't expect `{{loopStep['output'].item}}` to hold the whole list.

**Gotchas:**
- Iterations run **sequentially**, not in parallel — N items × per-item latency counts against the 600 s runtime budget. Big lists → chunk into sub-flows (`ap_load_guide('error_handling')`).
- `ap_test_step` does **not** execute loop bodies. Use `ap_test_flow` to exercise a loop.
- No built-in rate limiting — a fast loop against a rate-limited API will hit 429s.

## Deep nesting → flatten

More than ~2 levels of nested routers is a smell. Compute the decision once in a `CODE` step (return a single tag string), then use one router keyed on that tag instead of a deep tree.
