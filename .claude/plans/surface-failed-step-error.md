# Showing Failed Step Errors in Runs and Alert Emails

## The Problem

When a flow run fails, the user only sees a "Failed" badge in the run list. To find out **which step failed and why**, they have to open the run, scroll the step list, click the failed step, and read the error in the sidebar. The failure alert email has the same gap — it tells you a flow failed but not which step or what the error was.

This makes triage slow: "I got an email saying my flow failed, but I have to click through three screens to find out it was a 401 from Salesforce."

## What We're Shipping

Four places where the failed step's name and error become visible, all backed by one persisted shape on the run.

1. **Run list** — clicking the existing **Failed Step** column opens a dialog showing the step name, the error message, and a "View run" CTA.
2. **Run details** — a "Failed at: <step>" button inside the run-info widget jumps the user back to the failed step (and the right iteration of any enclosing loop) when they've navigated elsewhere.
3. **Failure alert email** — the email body now includes the failed step name and error message.
4. **Run-list filter** — a search input lets users find all runs whose failure message contains a given string (e.g. "401", "timeout").

The error message is persisted on the run row, truncated to keep database rows tidy. The full error remains available in the run's execution log.

## How a User Will Use It

- **From the dashboard:** "Failed" badges show in the run list. Clicking the failed-step cell opens a dialog with the error — read and triage without leaving the page.
- **From an alert email:** the email itself tells you what failed and why. No clicking required for triage.
- **From the run details:** the failed step is pre-selected on load with its error in the sidebar. If the user wanders off to inspect another step or loop iteration, a "Failed at:" button gets them back in one click.
- **For pattern triage:** searching "401" in the run-list filter surfaces every run that hit an auth error this week.

## Where the Changes Live

### 1. Persist the error message on the run

**File:** `packages/shared/src/lib/automation/flow-run/flow-run.ts`

The run schema already has a `failedStep` slot, but didn't store the error message. Add it as optional so old runs (which only had `name + displayName`) keep validating:

```ts
export const FailedStep = z.object({
  name: z.string(),
  displayName: z.string(),
  message: z.string().optional(),  // NEW
})
```

A small named helper truncates long error strings before they hit the database (cap is 700 chars + ellipsis):

```ts
export function truncateFailedStepMessage(
  failedStep: FailedStep | undefined,
): FailedStep | undefined {
  if (isNil(failedStep)) return undefined
  if (isNil(failedStep.message)) return failedStep
  return {
    ...failedStep,
    message: truncate(failedStep.message, FAILED_STEP_MESSAGE_MAX_LENGTH),
  }
}
```

The truncation runs at the worker boundary — `packages/server/api/src/app/workers/rpc/worker-rpc-service.ts` — when the engine reports the verdict. One line:

```ts
failedStep: truncateFailedStepMessage(input.failedStep),
```

The full untruncated error stays in the engine's log file; only the run-row summary is bounded. No database migration is needed — the column was already `jsonb`.

### 2. Failure alert email

**File:** `packages/server/api/src/assets/emails/issue-created.html`

Two new rows in the email template, each wrapped in a Mustache conditional so old runs (or any run without a captured message) degrade gracefully without broken markup:

```html
{{#failedStepDisplayName}}
<tr>
  <td ...><strong>Failed at:</strong> {{failedStepDisplayName}}</td>
</tr>
{{/failedStepDisplayName}}

{{#failedStepMessage}}
<tr>
  <td ... style="word-break: break-word;">
    <strong>Reason:</strong> {{failedStepMessage}}
  </td>
</tr>
{{/failedStepMessage}}
```

The two fields are threaded through the existing alert path:
- `flow-run-hooks.ts` reads `flowRun.failedStep` and adds it to the alert payload.
- `alerts-service.ts` forwards both fields into the email payload.
- `email-service.ts` extends `IssueCreatedArgs` with `failedStepDisplayName?` and `failedStepMessage?`.

### 3. Run list — clickable Failed Step cell

**New file:** `packages/web/src/features/flow-runs/components/runs-table/failed-step-dialog.tsx`

A focused component wrapping a Dialog with a project `Button` trigger (variant `link`), an `Info` icon to signal "click for details", the error message display, and a "View run" CTA. The error itself is rendered with the existing `JsonViewer` from `@/components/custom/json-viewer.tsx` — the same component used in the run-details panel for step output. It already handles strings (renders as `<pre>` with copy + download), gracefully degrades for objects (we may want to enrich `failedStep` with structured error fields later), and gives the user a one-click copy out of the box. No bespoke `<pre>` block, no hand-rolled copy button.

```tsx
export const FailedStepDialog = ({ failedStep, runId }) => {
  const navigate = useNavigate();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="justify-start"
        >
          <Info className="size-3.5" />
          {failedStep.displayName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t('Failed Step')}</DialogTitle>
        </DialogHeader>
        {failedStep.message ? (
          <JsonViewer
            json={failedStep.message}
            title={failedStep.displayName}
            hideDownload
          />
        ) : (
          <div className="italic text-muted-foreground">
            {t('No error message available')}
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => navigate(/* run details path */)}>
            {t('View run')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

Why `JsonViewer` and not `SimpleJsonViewer`: `JsonViewer` carries the title bar with copy + (optional) download, which is the contract we want. `hideDownload` is true here because the run row already deep-links to the full run; downloading a 700-char truncation would be misleading.

The trigger uses the project's `Button` component for consistent styling, with an `Info` icon that telegraphs "more info available." `stopPropagation` is critical — the row is already clickable for navigation, so without it, opening the dialog would also navigate the user away.

The runs-table column at `packages/web/src/features/flow-runs/components/runs-table/columns.tsx` swaps its plain-text cell for `<FailedStepDialog />`.

### 4. Run details — jump-to-failed-step button

**File:** `packages/web/src/app/builder/flow-canvas/widgets/run-info-widget.tsx`

A small button rendered inside the existing run-info widget — visible only when the user has navigated away from the failed step:

```tsx
{run.failedStep && selectedStep !== run.failedStep.name && (
  <button
    onClick={goToFailedStep}
    className="text-destructive hover:underline cursor-pointer font-medium"
  >
    Failed at: {run.failedStep.displayName} →
  </button>
)}
```

`goToFailedStep` is a new composed action on the run-state. It does the same thing the builder does on first load: select the failed step **and** snap any enclosing loop back to the iteration where the failure happened.

```ts
goToFailedStep: () => {
  const { run, selectStepByName } = get();
  if (isNil(run) || isNil(run.failedStep)) return;
  set((state) => ({
    loopsIndexes: flowRunUtils.pinLoopsToIterationsWithFailedStep(run, state.loopsIndexes),
  }));
  selectStepByName(run.failedStep.name);
}
```

So if the failed step is on iteration 3 of a loop and the user has scrolled to iteration 1, clicking the button takes them back to iteration 3 with the failed step selected.

To make the composition clearer, the existing helper `findLoopsState` is renamed to **`pinLoopsToIterationsWithFailedStep`** — a name that actually says what it does. Two existing call sites in the run-state init are updated.

### 5. Filter runs by failed-step message

**Files:**
- `packages/shared/src/lib/automation/flow-run/dto/list-flow-runs-request.ts` — adds `failedStepMessage: z.string().optional()` to the request schema.
- `packages/server/api/src/app/flows/flow-run/flow-run-service.ts` — adds an ILIKE clause on the jsonb message field, parallel to the existing `failedStepName` filter:

```ts
if (!isNil(params.failedStepMessage)) {
  query = query.andWhere(
    'flow_run."failedStep"->>\'message\' ILIKE :failedStepMessage',
    { failedStepMessage: `%${params.failedStepMessage}%` },
  )
}
```

- `packages/web/src/features/flow-runs/components/runs-table/index.tsx` — adds a `type: 'input'` entry to the existing `filters` array, mirroring the name-search pattern already used by the connections page:

```tsx
{
  type: 'input',
  title: t('Failed step message'),
  accessorKey: 'failedStepMessage',
  icon: SearchIcon,
}
```

The shared data-table framework handles debouncing and search-param wiring; the value flows into the runs query alongside the other filters.

The filter is case-insensitive substring match. Searching for `401` finds runs whose error message contains "401 Unauthorized: invalid_grant" or "Got 401 from /users". Combining the filter with status/date filters narrows further (AND semantics).

## Verification

- **Engine + API tests** — failed run persists the truncated message; old-run shape (no message) still validates and renders without crashing; list endpoint filters correctly by `failedStepMessage`.
- **Email** — template renders the new rows when fields are present; degrades cleanly when absent.
- **Web** — dialog opens and renders; row navigation does not fire while the dialog is open; "View run" CTA navigates correctly; jump-to-failed-step button respects visibility rules and handles loop iterations; filter input narrows the run list correctly.
- **Manual end-to-end** — broken HTTP step on a schedule, confirm:
  - Run list dialog shows step + error.
  - Alert email contains the step + error.
  - Run details button hides when on the failed step, appears when navigated away.
  - Loop-iteration case lands the user on the right iteration.
  - Search input ("401") narrows to matching runs only.
