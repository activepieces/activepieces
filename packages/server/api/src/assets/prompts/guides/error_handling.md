# Guide: Per-step error handling

Load this when the user wants the automation to react to a step failing instead of stopping. CODE and PIECE steps support per-step error handling.

- **Enable it**: pass `continueOnFailure: true` on `ap_add_step` (or `ap_update_step`). The flow keeps running when the step fails, and the step gains two outgoing branches: **On success** and **On failure**.
- **Add steps into a branch**: `ap_add_step` with `parentStepName` = the continue-on-failure step and `stepLocationRelativeToParent` = `INSIDE_ON_SUCCESS_BRANCH` (runs when it succeeded) or `INSIDE_ON_FAILURE_BRANCH` (runs when it failed). Chain further steps in a branch with `AFTER` the last step in that branch. This replaces wiring a separate Router/If just to handle failure.
- **Read the outcome**: in the On-success branch (or after the step) read its result via `{{stepName['output'].field}}`; in the On-failure branch read the error via `{{stepName['error'].message}}`.
- Only reach for branches when the user actually wants divergent behavior on failure. For "just don't stop the flow", `continueOnFailure: true` alone is enough. Use `retryOnFailure: true` when they want the step retried before it's considered failed.
- **Branch placement discipline**: success-branch = steps that depend on the step's output (processing, forwarding, updating); failure-branch = error handling, logging, fallback notifications. After building, call `ap_flow_structure` to verify every step is in the correct branch; if misplaced, `ap_delete_step` + `ap_add_step` to move it.
