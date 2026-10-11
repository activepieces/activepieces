---
icon: 🤝
---

# Admin Interactions

How every platform admin page talks back to the user: saving, confirming, success and failure. The blocks
live in `app/components/admin`; `scripts/check-admin-interactions.mjs` fails lint when a page under
`app/routes/platform` bypasses them.

**Action** — anything the admin triggers that changes data. Every action runs through `useAdminAction`
(`verb` + `name` + `run`), which gives it a pending state, one success toast, one error toast with the
server's message, and an optional Undo. The wording comes from `adminActionCopy`, never from the page:
"{name} deleted" / "Couldn't delete {name}". _Avoid_: a raw `toast.success`, "successfully", "Success",
"Error" as a title

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
- can lock people out (turn off email sign-in, disable SAML): `ConfirmDialog` that spells out the risk;
- destroys a whole space of other people's data (delete platform, delete project): `typeToConfirm`.
  Nothing else types to confirm. _Avoid_: "Are you sure…?", a red button for a non-destructive action

**Data state** — every fetched block has four: loading (skeleton), error ("Trouble loading…" with
Retry), empty, content. `AdminQueryState` renders the right one. A failed load never shows an empty
state, zeros, or a spinner that never ends.

**One error per failure** — `mutationFeedback` shows one error toast at a time and remembers the errors
it showed, so a dialog wrapping a failed action does not toast it again. A form that shows the error
inline uses `feedback: 'inline'` and no toast.

## Gotchas

- The global `MutationCache.onError` toast stays quiet only when `onError` is set on the hook (or the
  error was already shown), not when `onError` is passed to a single `mutate()` call.
- A confirm's `onConfirm` must return the request's promise (`mutateAsync`, not `mutate`), or the dialog
  closes before the work finishes and cannot show the failure.
- React Router allows one navigation blocker at a time; `SaveBar` mounts its guard only while dirty, so
  two save bars on one page do not fight.
- Feature locks (`PlanFeatureSample`, `LockedFeatureGuard`, `SaveBar` `locked`) follow their own rules
  and are out of scope here.

## Key files

- `packages/web/src/app/components/admin` — `useAdminAction`, `ConfirmDialog`, `InstantSwitch`,
  `AdminQueryState`, `SaveBar`
- `packages/web/src/lib/mutation-feedback.ts` — `mutationFeedback`
- `packages/web/scripts/check-admin-interactions.mjs` — the lint check and its shrinking allowlist
