# Guide: Per-step error handling

Load this when the user wants the automation to react to a step failing instead of stopping. CODE and PIECE steps support per-step error handling.

- **Enable it**: pass `continueOnFailure: true` on `ap_add_step` (or `ap_update_step`). The flow keeps running when the step fails, and the step gains two outgoing branches: **On success** and **On failure**.
- **Add steps into a branch**: `ap_add_step` with `parentStepName` = the continue-on-failure step and `stepLocationRelativeToParent` = `INSIDE_ON_SUCCESS_BRANCH` (runs when it succeeded) or `INSIDE_ON_FAILURE_BRANCH` (runs when it failed). Chain further steps in a branch with `AFTER` the last step in that branch. This replaces wiring a separate Router/If just to handle failure.
- **Read the outcome**: in the On-success branch (or after the step) read its result via `{{stepName['output'].field}}`; in the On-failure branch read the error via `{{stepName['error'].message}}`.
- Only reach for branches when the user actually wants divergent behavior on failure. For "just don't stop the flow", `continueOnFailure: true` alone is enough. Use `retryOnFailure: true` when they want the step retried before it's considered failed.
- **Branch placement discipline**: success-branch = steps that depend on the step's output (processing, forwarding, updating); failure-branch = error handling, logging, fallback notifications. After building, call `ap_flow_structure` to verify every step is in the correct branch; if misplaced, `ap_delete_step` + `ap_add_step` to move it.

## The HTTP piece has its own failure modes — and a trap
`@activepieces/piece-http`'s `send_request` exposes a piece-specific `failureMode`, separate from the platform `continueOnFailure` above:
```
retry_all   retry_5xx   retry_none
continue_all   continue_4xx   continue_none  (DEFAULT: stop on error)
```
**Shape-change trap:** in a `continue_*` mode a *failed* request returns a **different output shape** than a success, so `{{step_N['output'].body}}` can silently resolve to empty. (The piece swallows the error into `['output']` — unlike platform `continueOnFailure`, which puts it under `['error']`.) Gate on a success indicator and confirm BOTH shapes with `ap_test_step`:
```
ROUTER: EXISTS {{step_N['output'].body}} → success | Otherwise → failure
```

## Categorize failures — don't blanket-catch
4xx (not 429) → bad data, retrying won't help; log/alert. 429 → back off and retry. 5xx → retry capped, then alert. timeout/network → retry once, then dead-letter.

## Resuming a halted run
With `continueOnFailure` off, the run halts at the failing step with prior outputs intact. `ap_retry_run` offers **FROM_FAILED_STEP** (resume at the failure, reuse prior outputs — cheap) or **ON_LATEST_VERSION** (re-run from the start against the published flow).

## Human approvals block indefinitely
Approval actions (Slack/Gmail request-approval, Todos "create and wait") pause until a human decides — **no built-in timeout** (paused time doesn't count against the 600 s budget). The return shape varies by piece (`approved` boolean vs a `status` string like `Accepted`/`Rejected`) — **verify with `ap_test_step` before routing on it.** For a timeout, run a separate scheduled "kill-switch" flow, or pre-score with AI and only escalate borderline cases (`ap_load_guide('ai')`).

## Scale & decomposition — the 600 s ceiling
Split a flow when it risks the runtime ceiling or gets unwieldy (>~25 steps, >2 nesting levels, a loop over hundreds of items):
- **Free path:** child flows with webhook triggers; the parent's last step POSTs to the child (fire-and-forget → the child must be idempotent — `ap_load_guide('state')`). Each child gets its own 600 s budget.
- **Sub Flows piece:** a synchronous call with a return value (may require a specific plan — confirm availability before recommending).
- **Chunk big loops:** loop over chunks of N in the parent, dispatch each chunk to a child flow.
