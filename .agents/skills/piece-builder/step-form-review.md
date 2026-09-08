# Step-Form Review: improving an existing piece's forms

Use this when the task is "improve the UI of piece X" — copy, labels, descriptions, Advanced
placement — on a piece that already works. Nothing here changes `run()`. It distills what the
maintainers actually asked for on the HTTP (#15188), Google Sheets (#15200), Custom API Call
(#15248) and Google Docs (#15298) form passes, so the next pass gets it right on the first review.

Read `property-ui-selection.md` first for component choice; this file is about the review that
follows. `ux-guidelines.md` §2 holds the copy rules (70-character fold, option labels).

---

## 1. Find the human surface before touching anything

The builder hides `audience: 'ai'` actions from people (`filterActionsByAudience`, server-side).
Triggers carry no `audience` and are always visible. So:

- **Only edit human-visible actions and triggers.** AI-only actions have their own copy for agents;
  changing it is out of scope and touches strings a reviewer did not ask about.
- **`createCustomApiCallAction` is not the piece's code.** It lives in
  `packages/pieces/common/src/lib/helpers/index.ts`, is `audience: 'human'`, and is shared by
  ~470 pieces. For many pieces it is the *only* human action. Fix it once there; every consumer
  keeps its `...(props?.x ?? {})` override, so do not remove those spreads and add one for any prop
  you newly make `advanced`.
- A piece whose human surface is one action plus the connection modal is usually a small task with
  the real defects in the auth description, not the form.

`node .agents/skills/piece-builder/scripts/check-step-form.mjs <piece-dir>` (or `--file <saved.json>`
from a `curl` of `/api/v1/pieces/@activepieces/piece-<dir>`, no server needed) prints the human
surface and every finding below in one pass. Run it before and after.

---

## 2. What the builder does with your metadata (verified, with sources)

| Behaviour | Where | Consequence |
|---|---|---|
| Descriptions over **70 chars** fold behind "show more" | `packages/web/src/components/custom/read-more-description.tsx` | One short sentence per field. Count it. |
| Descriptions are **plain text** | same component (`whitespace-pre-wrap`, no markdown) | `**bold**` shows as literal asterisks. Markdown goes in `Property.MarkDown`. |
| The **whole label turns red** when a required field is empty | `packages/web/src/components/ui/form.tsx` `data-[error=true]:text-destructive` | Not a bug. It is why `Inputs *` reads red on a fresh trigger. |
| `SHORT_TEXT`, `LONG_TEXT`, `FILE`, `SECRET_TEXT`, `DATE_TIME` show **no `ƒ` toggle** | `packages/web/src/app/builder/piece-properties/properties-utils.tsx` | They accept `{{ }}` inline via `TextInputWithMentions`. Intentional. |
| `placeholder` renders on `ShortText` / `LongText` / `DateTime` / `File` / `SecretText` | same file (one shared `case` block passes it to `TextInputWithMentions`/`SecretInput`) | `Number` and `Object` (`DictionaryInput`) drop it silently. A `DateTime` example belongs in the placeholder, not the description. |
| `Property.MarkDown` rejects `advanced` | framework types (TS2353) | Instructions cannot be tucked into Advanced. |
| `Property.MarkDown` takes no condition | `MarkDownProperty` is a static value | A "when X is enabled…" banner shows always. Reorder it below the toggle and use `TIP`, or accept it. |
| **Ungrouped props render below every `section` card** | `packages/web/src/app/builder/piece-properties/filter-layout.tsx` | A section for the "top" fields pushes the rest under it. |
| Section members are **forced essential** | `collectForcedEssentialNames` | `advanced` is ignored inside `tabs`/`section`; `builder`/`footer` disable Advanced form-wide. |
| `display: 'cards'` truncates long option labels | card component | Cards are for 2–4 short modes. |
| `display: 'stepper'` implies bounds | stepper needs `min`/`max` | Uncapped numbers (timeouts) stay plain `Number`. |
| `OBJECT` accepts `{}` when required | `packages/pieces/framework/src/lib/property/util.ts` | `required: true` on a dictionary only paints an asterisk. |
| `advanced` exists from release **0.88.2** | | Set `minimumSupportedRelease: '0.88.2'` when you use it; older self-hosted renders the fields inline. |
| `OBJECT` and `JSON` props **save `{}`** on a fresh step | `packages/web/src/features/pieces/utils/form-utils.tsx` `getDefaultValueForProperties` | Every existing step of an action with an `Object` prop carries `{}` for it, used or not. |
| An `ARRAY` with `properties` is **zipped before `run()`** | `packages/server/engine/src/lib/variables/processors/array-zipper.ts`, called from `props-processor.ts` | A plain object stored on it arrives in `run()` as a **one-element array holding that object**, never as the object. A `{}` arrives as `[{}]`. |
| A patch upgrade in the version picker **keeps the saved input as-is** | `update-piece-version-utils.tsx` `getInputAfterVersionChange` | Whatever shape the old prop saved is what the new prop's widget opens with. |
| `ArrayPieceProperty` calls `.map` on the saved value | `packages/web/src/app/builder/piece-properties/array-property.tsx` | A non-array value (`{}`) throws into the field's error boundary: "input value is invalid, please contact support". Guarded on `main` once #15189 lands. |
| A dropdown shows a label **only for a value in its options** | `SearchableSelect` via `dynamic-dropdown-piece-property.tsx` | A plain ID or `{{ }}` expression saved by an older text input renders as the placeholder; the `ƒ` toggle flips only on click. The value still runs. |

---

## 3. Copy rules the reviewers enforce

**The governing rule: text fits its box.** Every container in the step panel has a fixed visible
width at the default 400 px panel — a description folds at 70 characters, a dropdown trigger shows
about 40, a `width: 'half'` field about 20, a code-style URL box clips before the query string (the
Published and Draft form URLs looked identical because `?useDraft=true` fell off the end), a card
option truncates a long label, and the step header truncates the action name. When the text is
longer than its box you have exactly two moves: **change the container** (full width instead of
half, a `Property.MarkDown` block that wraps instead of a description, a stacked layout instead of
two-up, an option `description` line instead of a longer label) **or shorten the text**. Shipping
clipped text is never the third option. `ux-guidelines.md` §2 gives the per-widget limits; the rules
below are the recurring cases.

1. **≤ 70 characters, one sentence.** Examples move into `placeholder` where the input renders one
   (`ShortText`/`LongText`); otherwise drop them. "Same rule as on the HTTP PR: one short sentence,
   examples go in placeholders." — #15200 review.
2. **Units and formats live in the description, never the label.** `Timeout (in seconds)` →
   `Timeout` + "Seconds to wait…"; `Text (Markdown)` → `Message` + "Markdown is rendered."
3. **No question marks on toggles**, and no space before punctuation. `Response is Binary ?` and
   `Include Shared Drive Sheets ?` were both flagged.
4. **Title Case for prop labels** (197:25 across the Google pieces) — *except* when a sibling form
   already uses another casing. See rule 6.
5. **Say what is true.** "Empty means no timeout" was wrong because `AP_FLOW_TIMEOUT_SECONDS` still
   applies; the accepted line is "Seconds to wait for a response. Empty: up to the flow limit
   (10 min)." Check the runtime before describing a default.
6. **Consistency beats local polish.** When the same prop appears on several actions — or the same
   form exists in two pieces (HTTP ↔ Custom API Call) — it gets **one label and one description**
   everywhere, and the existing one wins over your new one. #15248 was sent back because
   `Binary Response` / `Follow Redirects` differed from HTTP's `Response is Binary` /
   `Follow redirects`; #15200 because one toggle was `Use Column Names` on three actions and
   `Use Header Names` on the fourth. The checker's `sibling-*` rules catch the within-piece case;
   grep the nearest sibling piece for the cross-piece one.
7. **A description that restates the label is a line of wasted height.** `Bot Name` — "The name of
   the chatbot" says nothing; either add information or remove it.
8. **A dropdown that replaces a text input orphans the old values on screen.** Steps saved with a
   plain ID or a `{{…}}` expression show the picker's placeholder after upgrade while the saved value
   still runs (§2). Accepted on #15298, but only because the PR body said so. Say so.

---

## 4. Deciding what goes into Advanced

`advanced: true` collapses a prop into a section that starts closed. Ask four questions; any "yes"
keeps the field on the primary form:

1. **Is it required?** Never hide it — the docs forbid it and it only surfaces as an error.
2. **Does its default change the result?** Find Rows' `Number of Rows` defaults to `1`; hiding it
   means a search silently returns one row. Keep it visible; hide `Starting Row` instead.
3. **Does it change what the step reads at run time, not just what a dropdown lists?**
   `Include Shared Drives` only filters the Spreadsheet picker on most actions — Advanced is right.
   On New Spreadsheet and Find Spreadsheet(s) it changes which files the step sees — keep it visible.
   Give the shared prop a `{ advanced }` parameter rather than forking it.
4. **Is it the form's only field?** "Advanced, 1 option" with nothing above it is wrong.

Everything else — binary response, retries, follow redirects, timeouts, proxy settings — is a good
Advanced candidate when it is optional and has a default.

---

## 5. Do not touch

- `run()`, prop **names**, `defaultValue`s that alter behaviour, `audience`, `classification`.
- **A prop's `type`.** `Property.Object` → `Property.Array({ properties })` (or any other type change)
  is a **data migration wearing a UI change's clothes**: every saved step keeps the old shape and a
  patch upgrade opens the new widget on it (§2). Two things then go wrong at once, and #15298 shipped
  both: the builder crashes the field on `{}` — which *every* `Object` prop saved — and `run()` never
  sees the legacy shape you wrote a fallback for, because the engine zips a plain object into `[obj]`
  before the piece runs. A "legacy dictionary" branch on the raw value is dead code. If the widget is
  worth it anyway: (1) make `run()` accept the **wrapped** shape and unit-test that exact value —
  `toImageReplacements([{ 'kix.one': url }])`, not `toImageReplacements({ 'kix.one': url })`;
  (2) open a step saved on the previous version and upgrade it in the builder (§6.4); (3) if the
  web cannot render the old value, ship the web guard in the same PR or keep the old type.
  `check-step-form.mjs --before before.json` fails on any type change so this is caught before review.
- AI-only actions' copy.
- Locale files under `src/i18n/*.json`. `translation.json` is the Crowdin *source* and is
  regenerated (`npm run cli -- pieces generate-translation-file <piece-dir>`; it runs `bun install`,
  so restore `bun.lock` afterwards). Renaming a label orphans its translations until Crowdin
  catches up; say so in the PR, do not hand-fix it.

---

## 6. Verify like the reviewer will

1. Build: `npx turbo run build lint --filter=@activepieces/piece-<name> --force`. Report warning
   counts honestly and separate pre-existing from new.
2. Serve it: put the **directory** name in `AP_DEV_PIECES` (Human Input is `forms`), rebuild, restart
   the API (metadata is cached until restart), then read what is actually served:
   `curl -s "http://localhost:4200/api/v1/pieces/%40activepieces%2Fpiece-<name>"`.
3. `node .agents/skills/piece-builder/scripts/check-step-form.mjs <name>` — zero errors. Save the
   before/after JSON with `curl … > before.json` and run `--file` on each to show the reviewer the
   finding count dropped. Then run the after with `--before before.json`: it errors on any prop whose
   `type` changed or that disappeared, the two edits that break saved steps (§5).
4. Click through every changed form at the **default panel width** with a fresh step. Selecting a
   connection, a parent item and a child item so dependent fields render; flip each toggle that
   drives `DynamicProperties`. Then do it again with an **old step**: build the flow on the
   previous published version (pick it in the version picker, or import a flow JSON from before your
   change), save real values in every prop you touched, upgrade to your version, and check that every
   field renders and that a test run still uses those values. "Existing flows keep working" goes in
   the PR body only after this, never from reading the code.
5. Bump the piece `package.json` version. `pieces-common` is never published on its own; a change
   there reaches users only when consumers are bumped — say which in the PR.

---

## 7. The PR

- Fill both template sections — **Breaking change?** and **Security impact?** — with exactly one
  box each, or `breaking-change-check` fails. Label `🌟 feature` or `🐛 bug`, plus
  `🧩 area/third-party-pieces` or `🧩 area/core-pieces`.
- **Before/after screenshots** of the forms the reviewer will open, same conditions both sides:
  fresh step, default width, Advanced collapsed, scrolled to top. Name the height difference
  honestly ("~150 px shorter") rather than implying more.
- State the i18n consequence of renamed labels and that no locale files were edited.
- Name anything you deliberately left alone that a reviewer will hit while testing (a known crash
  with an open fix, an unrelated stale comment) so it is not filed against your PR.
- Every claim in the description must be true of the diff. Greptile caught "every prop keeps its
  override spread" when two did not.

---

## 8. What the maintainers asked for, verbatim by theme

| Theme | Ask | PR |
|---|---|---|
| Fold | "The builder cuts descriptions at 70 and adds 'show more'… one short sentence, examples go in placeholders." | #15200 |
| Consistency | "Same toggle, two names… Pick one label and one description for all four." | #15200 |
| Consistency | "HTTP piece uses 'Response is Binary'… requested matching labels between the two most similar forms in the product." | #15248 |
| Advanced | "Number of Rows defaults to 1 and is now inside Advanced, so a user searching for matches gets one row back and the control that changes that is hidden." | #15200 |
| Advanced | "On New Spreadsheet… it also changes what the step sees at run time… Keep it visible on those two." | #15200 |
| Accuracy | "'Leave empty for no limit' is inaccurate; should match… 'Empty: up to the flow limit (10 min)'." | #15248 |
| Widgets | Timeout as a capped stepper; section headers duplicating the field label; cards truncating options. | #15188 |
| Process | Missing template sections; `minimumSupportedRelease` still 0.86.4 with `advanced` in use; before/after screenshots. | #15200 |
| Migration | "The legacy `images` dictionary never reaches `toImageReplacements` in the shape you tested… the engine passes every ARRAY prop that has `properties` through `arrayZipperProcessor`… a plain object becomes a one-element array containing that object." | #15298 |
| Migration | "The builder shows an error on every upgraded Edit Template File step… the old `Property.Object` saved `{}` by default… the body's compatibility claim is not true today, so please fix before merge." | #15298 |
| Process | "Steps saved before this PR hold a plain ID or a `{{…}}` expression in what is now a dropdown… shows a placeholder while the saved expression still runs. Fine to accept, but say it in the PR body." | #15298 |
| Process | "We track pieces work in Linear; please link a PIE ticket" — and one for anything you called a follow-up. | #15298 |
