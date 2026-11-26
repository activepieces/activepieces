# Property UI Selection Guide

**Read this before defining `props` on any action or trigger.** `props-patterns.md` tells you the *syntax* of each property type; this file tells you *which component, display mode, and layout to pick for the use case* so the step form reads well for a non-technical user.

The mental model: **choose the input type → apply a display upgrade if one fits → arrange with layout hints → group with `propertyGroups` only when the form is large or has distinct modes.** Most props need only the first step.

---

## 1. Pick the input component (by use case)

| The user needs to enter… | Use | Notes |
|---|---|---|
| A short single-line value (name, email, id) | `Property.ShortText` | Add `placeholder`. Prefer a dropdown over a raw ID field — see rule below. |
| A long free-form value (notes, description) | `Property.LongText` | Multi-line textarea. |
| A formatted message body (email, chat post) | `Property.RichText` + `formatProperty` | Toolbar + `{{ variables }}`. Pair with a sibling format dropdown. See §2. |
| Yes/no, on/off | `Property.Checkbox` | Use `reveals` to show dependent fields only when on. See §2. |
| A number | `Property.Number` | Add `display: 'stepper'` for bounded counts. See §2. |
| One choice from a **fixed** list | `Property.StaticDropdown` | Add `display: 'cards'` for ≤4 visual choices. See §2. |
| Many choices from a fixed list | `Property.StaticMultiSelectDropdown` | |
| One choice **fetched from the API** | `Property.Dropdown` | `refreshers`, `options` async. This is the answer to "don't make users type IDs". |
| Many choices fetched from the API | `Property.MultiSelectDropdown` | |
| A date + time | `Property.DateTime` | Single instant. |
| A time **window** (last 7 days, custom range) | `Property.DateRange` | For search/filter actions. `display: 'dropdown'` inside a filter builder. See §2. |
| Fields that change based on earlier input/API | `Property.DynamicProperties` | Build the sub-form in `props()`. Heaviest option — use only when the shape is genuinely runtime-dependent. |
| A file (upload or URL) | `Property.File` | Returns `ApFile`. |
| A color | `Property.Color` | Swatch + hex. |
| Raw JSON | `Property.Json` | Only when there is no better structured option. |
| Free-form key→value pairs | `Property.Object` | Dictionary editor. |
| A list of plain strings | `Property.Array` (no `properties`) | Tags, emails. |
| A list of structured rows | `Property.Array` **with** `properties` | Repeating record editor (e.g. line items). |
| Read-only instructions / setup steps | `Property.MarkDown` | Display-only, collects nothing. Use `variant` (INFO/WARNING/TIP/BORDERLESS). |
| A fully custom widget (embedding only) | `Property.Custom` (BETA) | DOM injection. Requires `minimumSupportedRelease >= 0.58.0`. Avoid unless embedding. |

**Never make users type an opaque ID.** If a value exists behind the API (channel, project, contact, board), use `Property.Dropdown` so they pick it by name. Raw `ShortText` for an ID is a last resort and needs a `description` that explains exactly where to find it.

---

## 2. Display upgrades (opt-in, per property)

These are optional `display`/pairing hints on an otherwise normal property. They are safe to add and ignored where they don't apply.

### `StaticDropdown` → `display: 'cards'`
Use for a **small set (2–4) of mutually exclusive modes** where each choice benefits from an icon + one-line explanation (e.g. Plain text / HTML / Markdown). Do **not** use cards for long lists — they don't scroll well.
```typescript
Property.StaticDropdown({
  displayName: 'Format', required: true, defaultValue: 'plain_text', display: 'cards',
  options: { options: [
    { label: 'Plain text', value: 'plain_text', description: 'Simple', icon: 'text' },
    { label: 'HTML', value: 'html', description: 'Rich + styled', icon: 'code' },
  ] },
});
```

### `Number` → `display: 'stepper'`
Use for a **bounded** count the user nudges (max results, retries, quantity). Requires sensible `min`/`max`; add `step`.
```typescript
Property.Number({ displayName: 'Max results', required: false, defaultValue: 10, display: 'stepper', min: 1, max: 500, step: 1 });
```

### `RichText` + `formatProperty`
Use for any **message body** the user composes. Pair it with a sibling `StaticDropdown` (ideally `display: 'cards'`) and point `formatProperty` at that dropdown's **name**. The returned value is a plain string in the chosen format.
- Sibling value mapping (by convention): `plain_text` / `plain` / `text` → plain · `html` → HTML · `markdown` / `md` → markdown · anything else → plain.

### `DateRange` (+ `display: 'dropdown'`)
Use for "limit results to a time window" on search/list actions. Omit `display` for pill buttons; set `display: 'dropdown'` when it lives inside a filter builder. Resolve in `run()`:
```typescript
import { dateRangeUtils } from '@activepieces/pieces-framework';
const { after, before } = dateRangeUtils.resolve(context.propsValue.date_range); // ISO strings or undefined
```

### `Checkbox` → `reveals`
Use to **progressively disclose** fields that only matter when the toggle is on. List the dependent prop names; they render indented beneath the toggle.
```typescript
has_attachment: Property.Checkbox({ displayName: 'Has attachment', required: false, defaultValue: false, reveals: ['attachment_name'] }),
attachment_name: Property.ShortText({ displayName: 'Attachment name', required: false, placeholder: 'e.g. invoice.pdf' }),
```

---

## 3. Layout hints (any property)

These live directly on the property. They fine-tune placement without changing the input.

| Hint | Value | Use when |
|---|---|---|
| `placeholder` | string | Any text input — show an example value (`you@example.com`). |
| `width` | `'half'` | Two short related fields should sit side-by-side (First / Last name). Only takes effect **inside a `section` group**. |
| `icon` | icon name | Give a filter-builder row or section field a leading glyph. Must be a **valid name** — see §5. |
| `advanced` | `true` | Tucks a secondary field into the collapsible **Advanced** section. Nothing collapses there unless you set it — `advanced: false` is the default and does nothing. |

**Advanced section rule:** every prop renders in the main form by default, required or not. Opt a field *out* with `advanced: true`. Don't set it on a required prop — the Advanced section starts collapsed, so a mandatory field hidden there only surfaces as a validation error.

Before flagging a field `advanced`, ask four questions; any "yes" keeps it on the primary form: is it required? does its **default change the result** (a "Number of Rows" that defaults to 1)? does it change **what the step reads at run time**, not just what a dropdown lists (an "Include Shared Drives" toggle on a search or trigger)? is it the **form's only field**? `advanced` exists from release **0.88.2** — set `minimumSupportedRelease` accordingly or older self-hosted installs render the field inline. Full reasoning and the review history: `step-form-review.md` §4.

---

## 4. Grouping props with `propertyGroups`

Only add groups when the form is large or has distinct concerns. A short form (≤4 fields) needs none. Declare `propertyGroups` on the action/trigger; each group lists members by `name`:

```typescript
propertyGroups: [{ key, display, label?, description?, icon?, props: ['fieldA', 'fieldB'] }]
```
(Threaded through both `createAction` and `createTrigger`.)

**Pick the layout by intent:**

| Intent | `display` | Behaviour |
|---|---|---|
| Mutually-exclusive **modes** of the same concept (To / Cc / Bcc; by-URL vs by-ID) | `'tabs'` | Segmented control; one tab's fields visible at a time. |
| **Related fields as a titled card** (a "Send to" card, a "Message" card) | `'section'` | Titled card; `width: 'half'` packs two-up. **Keeps the Advanced section** for props outside the cards — group members are always essential. |
| A **search/filter** action where users add only the filters they need | `'builder'` | Progressive "Add filter" picker; each `builder` group is a category. A filter row persists only when its value is set — give each filter a `placeholder` + `icon`. |
| A pinned control **below** a filter builder (result limit) | `'footer'` | Pins its prop (e.g. a `stepper`) under the builder list. Pair with `'builder'` groups — like `'builder'`, it disables the Advanced section form-wide. |

**Rules:**
- Every prop named in a group must exist in `props`.
- Only ungrouped props honour `advanced: true` — members of `tabs` and `section` groups are always essential; the flag is ignored on them. In a sectioned layout, checkbox `reveals` targets are forced essential too: they render inline under their toggle, never in Advanced.
- **One `builder` or `footer` group disables the Advanced section for the whole action/trigger** — every prop is forced essential and `advanced: true` stops working form-wide. Don't combine a filter builder with Advanced props.
- **Ungrouped props render below every `section` card**, in declaration order. A section meant to hold "the top fields" pushes everything ungrouped underneath it — either group all the primary fields or none of them.
- Give `section` and `builder` groups a `label` and `icon` so cards/categories read clearly.

---

## 5. Valid `icon` names

`icon` accepts only these keys (each maps to a Lucide icon). Any other string renders nothing:

```
text · code · markdown · reply · reply-all · users · user · send · type
file · paperclip · tag · inbox · calendar · trash · filter · sliders · blank
```

---

## 6. Worked examples

**Send a chat message — sectioned cards + card dropdown + rich body:**
```typescript
propertyGroups: [
  { key: 'destination', display: 'section', label: 'Send to', icon: 'send', props: ['chat_id'] },
  { key: 'message',     display: 'section', label: 'Message',  icon: 'text', props: ['format', 'message'] },
],
props: {
  chat_id: Property.ShortText({ displayName: 'Chat Id', required: true, placeholder: '@channel or 123456789' }),
  format:  Property.StaticDropdown({ displayName: 'Format', required: false, display: 'cards', options: { options: [/* Markdown / HTML / Plain */] } }),
  message: Property.RichText({ displayName: 'Message', required: true, formatProperty: 'format' }),
  disable_notification: Property.Checkbox({ displayName: 'Disable notification', required: false, advanced: true }), // → Advanced (ungrouped + flagged)
},
```

**Search emails — filter builder + footer stepper + date range:**
```typescript
propertyGroups: [
  { key: 'people', display: 'builder', label: 'People', icon: 'users',    props: ['from', 'to'] },
  { key: 'time',   display: 'builder', label: 'Time',   icon: 'calendar', props: ['date_range'] },
  { key: 'footer', display: 'footer',  props: ['max_results'] },
],
props: {
  from: Property.ShortText({ displayName: 'From', required: false, icon: 'user', placeholder: 'sender@example.com' }),
  to:   Property.ShortText({ displayName: 'To',   required: false, icon: 'send', placeholder: 'recipient@example.com' }),
  date_range:  Property.DateRange({ displayName: 'Date', required: false, display: 'dropdown', icon: 'calendar' }),
  max_results: Property.Number({ displayName: 'Max results', required: false, defaultValue: 10, display: 'stepper', min: 1, max: 500 }),
},
```

**Recipients — segmented tabs:**
```typescript
propertyGroups: [{ key: 'recipients', display: 'tabs', label: 'Recipients', props: ['to', 'cc', 'bcc'] }],
props: {
  to:  Property.Array({ displayName: 'To',  required: true }),
  cc:  Property.Array({ displayName: 'Cc',  required: false }),
  bcc: Property.Array({ displayName: 'Bcc', required: false }),
},
```

---

## 7. Anti-patterns

- **Raw ID `ShortText` where a `Dropdown` is possible.** Pick-by-name beats copy-paste-an-id every time.
- **`display: 'cards'` on a long list.** Cards are for 2–4 modes; use a plain dropdown otherwise.
- **`propertyGroups` on a 3-field form.** Grouping is overhead — only add it for large or multi-mode forms.
- **Invalid `icon` name.** Anything outside the §5 list silently renders nothing; verify before shipping.
- **`Property.Json` as an escape hatch.** If the shape is known, model it with real props or an `Array` of fields.
- **`Property.DynamicProperties` for a static form.** It's the heaviest widget; only use it when fields truly depend on runtime data.
- **`advanced: true` on a required prop.** Advanced starts collapsed; a mandatory field hidden there only surfaces as a validation error.
- **`advanced: true` on a field whose default decides the outcome.** A result limit defaulting to 1 hidden in Advanced means a search silently returns one row; keep it visible and hide the offset instead.
- **Units or formats in the label.** `Timeout (in seconds)`, `Text (Markdown)` — the unit goes in the description, the label stays a noun.
- **A `?` on a toggle label.** `Response is Binary ?` — a checkbox is a statement, not a question, and never takes a space before punctuation.
- **The same prop with two labels.** If `useHeaderNames` is `Use Column Names` on three actions it is not `Use Header Names` on the fourth, and a Custom API Call form matches the HTTP piece's labels rather than inventing its own. Grep the siblings before naming anything.

Full type syntax and dynamic-dropdown/refresher mechanics: `props-patterns.md`. Rendered previews of every option: `docs/build-pieces/piece-reference/properties.mdx`.
