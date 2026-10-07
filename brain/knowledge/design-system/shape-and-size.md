---
icon: 📐
---

# Shape and size

One type scale, one control-height ladder, one radius ladder and one spacing rhythm. Every value is a stock
Tailwind step: `styles.css` redefines no radius and no font size. The primitives in `components/ui/` carry these
values, so a call site almost never states a height, a radius or a padding.

## Type — 14 body, 12 meta

| Role | Class |
| --- | --- |
| Page title | `text-2xl font-semibold` |
| Section heading, dialog and sheet title, empty-state title | `text-base font-semibold` |
| Card title | `text-sm font-semibold` |
| Body: buttons, inputs, menu items, labels, table cells, prose | `text-sm` |
| Meta: hints, timestamps, badges, tooltips, group labels | `text-xs` |
| Display figures | `text-3xl` and up, stat tiles and marketing surfaces only |

Nothing is smaller than `text-xs` and nothing is `uppercase`: an eyebrow is sentence case, `text-xs font-medium
text-gray-11`. Weights are `font-medium` for things you operate and `font-semibold` for headings; no `font-bold`.
No arbitrary `text-[…]`, `leading-[…]` or `tracking-[…]`: use `leading-*` steps (fractional steps such as
`leading-5.5` are valid in v4) and `tracking-tight` / `tracking-wide`.

## Control height — 36 default

| Size | Height | Where |
| --- | --- | --- |
| `default` | 36px `h-9` | buttons, inputs, select triggers, tab lists, toggles |
| `sm` | 32px `h-8` | inside rows, table cells, toolbars' second rank, popovers, the flow builder |
| `xs` | 28px `h-7`, 12px label | dense cells, inline chips |
| `lg` | 40px `h-10` | auth pages only |

Icons inside controls and menu rows are `size-4` (the primitive sets it). Badge 20px. Checkbox and radio 16px.
Switch 20px tall (`sm` 16px).

`Button`, `Input`, `SelectTrigger` and `Toggle` take `size`; a call site does not pass `h-*`, `rounded-*` or
padding to them. If no size fits, the primitive is missing a size, not the call site a class.

## Radius — role, then nesting

| Class | px | Role |
| --- | --- | --- |
| `rounded-sm` | 4 | parts 16px and smaller: checkbox, kbd, tooltip arrow, tiny chips |
| `rounded-md` | 6 | rows and small parts: menu, select and command rows, tab triggers, badges, tooltips, list rows |
| `rounded-lg` | 8 | controls and tracks: button, input, textarea, select trigger, toggle, tab list |
| `rounded-xl` | 12 | surfaces: card, dialog, popover, hover card, menu, select and command popups, banners, toasts, table frames |
| `rounded-full` | | circles and pills: avatar, status dot, switch, progress track |

Rows are deliberately one notch below controls: a 6px row reads as a row, not as a button.

**Nesting overrides role.** Inside a rounded box with inset padding `p`, the inner radius is `outer − p`, so the
inner shape runs parallel to the outer one:

| Outer | Inset | Inner | Example |
| --- | --- | --- | --- |
| `rounded-xl` 12 | `p-1.5` 6 | `rounded-md` 6 | dropdown, context menu, select and command popups with their rows |
| `rounded-lg` 8 | `p-0.5` 2 | `rounded-md` 6 | tab list with its triggers, segmented controls, toggle groups |
| `rounded-lg` 8 | 2px | `rounded-md` 6 | an input with a button inside it |
| `rounded-xl` 12 | `p-4`+ | `rounded-lg` 8 | a card inside a card or dialog: step down one role when the inset is larger than the inner radius |

If role and nesting disagree, change the padding, not the radius. A radius never reaches half the shortest side
unless the shape is meant to be a pill (`rounded-full`).

No `rounded-[…]` (except `rounded-[inherit]`), bare `rounded`, `rounded-xs`, `rounded-2xl` or `rounded-3xl`.

## Spacing rhythm — 8 / 16 / 24

| Step | Between |
| --- | --- |
| `gap-2` 8 | parts of one block: label to control, title to hint, icon to text |
| `gap-4` 16 | siblings inside a block: fields in a form, cards in a grid |
| `gap-6` 24 | blocks on a page: header to first block, toolbar to table, card to card |

Card padding is `p-5`, dialog padding `p-6`, popover `p-4`, menu `p-1.5`. Space with `gap`, not margins; no
negative margins. To overlay an element on another, position it (`absolute inset-0`) instead of pulling it with a
negative margin.

## Enforcement

`npm run lint` in `packages/web` runs `scripts/check-tailwind-classes.mjs`, which fails on classes Tailwind
cannot generate, `var()`s nothing defines, and the banned classes above: `text-[<number>…]`, `text-xss`,
`leading-[…]`, `tracking-[…]`, `uppercase`, bare `rounded`, `rounded-xs`, `rounded-2xl`, `rounded-3xl`,
`rounded-[…]`, `font-bold`/`font-extrabold`/`font-black`, and negative margins.

`SIDEBAR_REBUILD_PATHS_EXEMPT_FROM_BANNED` in that script skips the banned-class check for the sidebar and
layout shells while they are being rebuilt; remove each path once its rebuild lands.

## Gotchas

- `cn()` uses tailwind-merge 3, which knows Tailwind v4's class groups; a call-site `size-*` or `rounded-*`
  overrides the primitive's value instead of both landing.
- Before this contract `rounded-lg` was overridden to 12px. Existing call sites were moved to `rounded-xl` so
  they kept their shape; new code reads the ladder above.
