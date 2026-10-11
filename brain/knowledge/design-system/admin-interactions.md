---
icon: 🤝
---

# Admin Interactions

How every platform admin page talks back to the user: saving, confirming, success and failure. The blocks
live in `app/components/admin`; `scripts/check-admin-interactions.mjs` fails lint when admin code (the
routes under `app/routes/platform` and the admin-only feature hooks) bypasses them: a `sonner` import or
raw toast, a spinner, the legacy confirm, or a `useMutation` with no `onError`.

**Action** — anything the admin triggers that changes data. Page actions run through `useAdminAction`
(`verb` + `name` + `run`), which gives it a pending state, one success toast, one error toast with the
server's message, and an optional Undo. The wording comes from `adminActionCopy` ("{name} deleted" /
"Couldn't delete {name}"), or from `messages` when the name does not read well inside it. Feature hooks
that need optimistic updates (tiers, piece sets) keep `useMutation` and report through
`mutationFeedback` with the same wording; dialogs with their own mutation use `adminFeedback.done`.
Shared dialogs that also appear outside admin take an `adminFeedback` option instead of changing their
app behaviour. _Avoid_: a raw `toast.success`,
"successfully", "Success", "Error" as a title

**Batch** — an action on several rows. `adminBulk.runEach` runs them all, keeps what succeeded, and
reports the failures in one error, then throws so no success toast follows. On a partial failure the
caller closes and keeps only the failed rows selected (`adminBulk.failedItems`; admin tables key rows by
id, so the selection survives the refetch); a full failure keeps the confirm open.

**Block** — one settings panel, sheet or dialog. Saving is decided per block, not per control:
- a block with only switches saves each switch on the spot (`InstantSwitch`), no Save button;
- a block with any typed field is a form: every control in it, switches included, is part of the draft
  and saves through `SaveBar`. A block never mixes the two.

**Save bar** — `SaveBar`, the footer of a form block. It shows "You have unsaved changes" or the save
error, Discard and Save, warns before leaving with unsaved edits and saves on Cmd/Ctrl+S. Pages do not
wire their own leave guard.

**Confirmation level** — how much friction an action gets, by what it can destroy:
- reversible (deactivate, turn off): no confirm, an Undo toast instead;
- irreversible (delete a key, role, connection, template): `ConfirmDialog` naming the item and the
  consequence, one click;
- can lock people out (turn off email sign-in, disable SAML, new SAML settings): `ConfirmDialog` that
  spells out the risk, and blocked outright when it would leave no sign-in method;
- destroys a whole space of other people's data (delete platform, delete project): `typeToConfirm`.
  Nothing else types to confirm. _Avoid_: "Are you sure…?", a red button for a non-destructive action

**Data state** — every fetched block has four: loading (skeleton), error ("Trouble loading…" with
Retry), empty, content. `AdminQueryState` renders the right one. A failed load never shows an empty
state, zeros, or a spinner that never ends.

**One error per failure** — `mutationFeedback` remembers the errors it showed, so a dialog wrapping a
failed action does not toast the same failure again. A form that shows the error inline uses
`feedback: 'inline'` and must show it (`handleError`, or `form.setError` with `mutationFeedback.message`).

## Gotchas

- The global `MutationCache.onError` toast stays quiet only when `onError` is set on the hook (or the
  error was already shown), not when `onError` is passed to a single `mutate()` call.
- A confirm's `onConfirm` must return the request's promise (`mutateAsync`, not `mutate`), or the dialog
  closes before the work finishes and cannot show the failure.
- React Router allows one navigation blocker at a time. Every dirty `SaveBar` registers, and only the first
  one mounts the guard. Cmd/Ctrl+S never opens the browser's Save page while a save bar is mounted; it
  does nothing while a modal dialog or sheet is open, and with two dirty bars it saves only the one inside
  the form that holds focus.
- A block nested inside a page (a detail view inside a tab) puts its `SaveBar` in `AdminPageFooter`, so
  it sits in the page footer like every other save bar.
- A polled or refetched view passes `hasData` to `AdminQueryState` (or checks `isError && data === undefined`):
  a failed refresh keeps the last data on screen instead of replacing it with an error.
- Error text is the server's message when it has one (`params.message`, or a 4xx `message`), friendly copy
  for permission, not-found, plan and schema-validation errors, and the generic message only for unknown
  and JS errors. An error written for the admin is thrown with `mutationFeedback.userError`.
- Sign-in lock-out: the email, Google and SAML controls are blocked (with a hint) when they are the last
  method; every save, confirm and Undo re-checks against freshly fetched platform data first; and the
  platform update endpoint rejects any change that leaves no sign-in method, so a stale tab or a second
  admin cannot get around the UI.
- Focus return to a row menu's trigger and ignoring clicks on toasts apply only inside `AdminPage`
  (`MenuFocusReturnScope`); dialogs elsewhere in the app behave as Radix does.
- Feature locks (`PlanFeatureSample`, `LockedFeatureGuard`, `SaveBar` `locked`) follow their own rules
  and are out of scope here.

## Key files

- `packages/web/src/app/components/admin` — `useAdminAction`, `ConfirmDialog`, `InstantSwitch`,
  `AdminQueryState`, `SaveBar`
- `packages/web/src/lib/mutation-feedback.ts` — `mutationFeedback`
- `packages/web/scripts/check-admin-interactions.mjs` — the lint check (part of `npm run lint` in web)
