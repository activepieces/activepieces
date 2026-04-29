# Passing Error Messages Between Steps

## The Problem

When a step in a flow fails, users have no way to access the error message in the steps that come after. **Continue on failure** lets the flow keep going, but the error itself is invisible to anything downstream.

This blocks a common pattern:

- "If the API call fails, post the error to Slack and continue."
- "If the response is a 401, refresh the token; if it's a 429, wait and retry."
- "Log the failure reason, then move on."

Today users either swallow the failure quietly or write awkward workarounds that lose the original error.

## What We're Shipping

Two changes that work together:

1. **A failed step now exposes its error to the rest of the flow.** Reference it as `{{step_name.error.message}}` — the same way you reference any other step's output.

2. **The data picker shows an "On failure" section** under any step that has continue-on-failure enabled. Users pick the error message the same way they pick output fields, no documentation required.

## How a User Will Use It

The router-on-error journey becomes native:

1. Add an HTTP step. Toggle **Continue on failure** on.
2. Add a router after it.
3. Open the router's branch condition. Click the data picker:

   ```
   ▼ http_step
        Outputs
        ├── status
        ├── body
        └── headers

        On failure
        └── error
            └── message
   ```

4. Pick `error.message`, write `contains "401"`, save.
5. When the step fails with a 401, the matching branch fires.

No new piece, no scripting, no workaround.

## Where the Changes Live

Two files. One small backend change, one focused frontend change.

### 1. Runtime engine — expose the error to downstream steps

**File:** `packages/server/engine/src/lib/handler/context/flow-execution-context.ts`

This helper decides what each step's value looks like when later steps reference it. Today it only forwards the success output. We add a single branch so that failed steps return their error instead.

```ts
// Before
function extractOutput(steps) {
  return Object.entries(steps).reduce((acc, [stepName, step]) => {
    acc[stepName] = step.output
    return acc
  }, {})
}

// After
function extractOutput(steps) {
  return Object.entries(steps).reduce((acc, [stepName, step]) => {
    if (step.status === StepOutputStatus.FAILED) {
      acc[stepName] = { error: { message: step.errorMessage } }
    } else {
      acc[stepName] = step.output
    }
    return acc
  }, {})
}
```

Roughly five lines. Successful steps behave exactly as before — failed steps now have a defined shape downstream code can read.

### 2. Flow builder — add the "On failure" section to the data picker

**File:** `packages/web/src/app/builder/data-selector/utils.ts`

The picker walks each step and builds a tree of pickable fields from its sample data. When a step has continue-on-failure enabled, we attach an extra branch with the error fields.

```ts
// Inside the function that builds a step's pickable tree:
function traverseStep(step, sampleData, ...) {
  const stepNode = traverseOutput(displayName, [step.name], sampleData[step.name], ...)

  // NEW — attach the "On failure" branch when continue-on-failure is on
  if (step.settings.errorHandlingOptions?.continueOnFailure?.value === true) {
    stepNode.children.push(buildOnFailureNode(step.name))
  }

  return stepNode
}

// NEW helper — produces the static failure subtree
function buildOnFailureNode(stepName) {
  return {
    key: `${stepName}_on_failure`,
    data: { type: 'chunk', displayName: 'On failure' },
    children: [{
      key: `${stepName}_error_message`,
      data: {
        type: 'value',
        displayName: '⚠️ Error message',
        propertyPath: `${stepName}.error.message`,
        value: 'runtime error (Unauthorized 401)',  // placeholder preview
        insertable: true,
        tooltip: 'Available at runtime when this step fails.',
      },
    }],
  }
}
```

Two pieces: a one-line attachment in the existing tree-walker, plus a small helper that defines the failure branch and its tooltip. The engine and builder agree on the same shape (`step.error.message`), so what users pick in the editor is exactly what the runtime delivers.

## Known Limitation

When a user clicks **Test step** on a downstream step that references `{{step.error.message}}`, the value resolves to empty in test mode. Reason: we don't persist the error from a failed test yet, and the in-editor state isn't visible to the engine.

**Mitigation in this PR:** a tooltip on the failure leaf in the picker reading *"Available at runtime when this step fails."* — sets expectations clearly. This is the natural launch point for the next iteration.

## What Comes Later

Two follow-ups, decoupled and shippable independently:

1. **Persisted failure samples** — save the error string from a failed test alongside the existing sample data. Unlocks real preview values in the picker, persistence across sessions, and full test-step support for the failure path.
2. **Richer error fields** — the `{ error: { message } }` shape was chosen so we can add `code`, `timestamp`, or `stackTrace` later without breaking any references users have already written.

## Verification

- **Engine unit test** — a failed step's error reaches a downstream step that references it.
- **Builder unit test** — picker shows the "On failure" section only when continue-on-failure is enabled.
- **Manual end-to-end** — build a 2-step flow with a deliberately broken HTTP call. Confirm a router after it branches correctly on the error message contents.
