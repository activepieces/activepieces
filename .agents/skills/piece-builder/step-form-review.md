# Step-Form Review: improving an existing piece's forms

Use this when the task is "improve the UI of piece X" — copy, labels, descriptions, Advanced
placement — on a piece that already works. Nothing here changes `run()`. It distills what the
maintainers actually asked for on the HTTP (#15188), Google Sheets (#15200) and Custom API Call
(#15248) form passes, so the next pass gets it right on the first review.

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
| `placeholder` renders only on `ShortText` / `LongText` | same file | `Number` and `Object` (`DictionaryInput`) drop it silently. |
| `Property.MarkDown` rejects `advanced` | framework types (TS2353) | Instructions cannot be tucked into Advanced. |
| `Property.MarkDown` takes no condition | `MarkDownProperty` is a static value | A "when X is enabled…" banner shows always. Reorder it below the toggle and use `TIP`, or accept it. |
| **Ungrouped props render below every `section` card** | `packages/web/src/app/builder/piece-properties/filter-layout.tsx` | A section for the "top" fields pushes the rest under it. |
| Section members are **forced essential** | `collectForcedEssentialNames` | `advanced` is ignored inside `tabs`/`section`; `builder`/`footer` disable Advanced form-wide. |
| `display: 'cards'` truncates long option labels | card component | Cards are for 2–4 short modes. |
| `display: 'stepper'` implies bounds | stepper needs `min`/`max` | Uncapped numbers (timeouts) stay plain `Number`. |
| `OBJECT` accepts `{}` when required | `packages/pieces/framework/src/lib/property/util.ts` | `required: true` on a dictionary only paints an asterisk. |
| `advanced` exists from release **0.88.2** | | Set `minimumSupportedRelease: '0.88.2'` when you use it; older self-hosted renders the fields inline. |

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
   finding count dropped.
4. Click through every changed form at the **default panel width** with a fresh step. Selecting a
   connection, a parent item and a child item so dependent fields render; flip each toggle that
   drives `DynamicProperties`.
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
