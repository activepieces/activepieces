---
icon: 📐
---

# Shape and size

One density, one radius ladder, one page frame. Every value is a stock Tailwind step: `styles.css`
redefines no radius and no font size. The primitives in `components/ui/` and the page blocks in
`components/custom/page` carry these values, so a call site almost never states a size, a radius or a
padding.

## Type — 16 body, 14 meta, nothing under 14

| Role | Class | Where it lives |
| --- | --- | --- |
| Page title | `text-3xl font-semibold tracking-tight` | `PageHeader` |
| Section heading | `text-xl font-semibold` | `SectionHeading` |
| Card, dialog, sheet, empty-state title | `text-base font-semibold` | the primitive |
| Body | `text-base` | buttons, inputs, menu items, labels, a row's title, prose, dialog descriptions |
| Meta | `text-sm` | table cells, a row's second line, hints, timestamps, counts, badges, tooltips, kbd |
| Figures | `text-3xl` / `text-4xl font-semibold` | stat tiles only |

**A line you read is body; a line you scan is meta.** `text-xs` is not used. Neither is `uppercase`:
a group label is sentence case, `text-sm font-medium text-gray-11`. No arbitrary `text-[…]`,
`leading-[…]` or `tracking-[…]`: every named size carries its own line height.

Weights: `font-medium` for things you operate and a row's title, `font-semibold` for headings. No
`font-bold`.

## Radius — role, then nesting

**Role sets the radius of anything outermost.**

| Class | px | Role |
| --- | --- | --- |
| `rounded-lg` | 8 | **control** — button, input, textarea, select trigger, badge, chip, tooltip, segment |
| `rounded-xl` | 12 | **row / track / small tile** — a full-width clickable line (rail item, menu row), a track holding controls (tab list), a square tile up to 36px |
| `rounded-2xl` | 16 | **surface** — an inline banner, a tile of 48px and up, a floating bar |
| `rounded-3xl` | 24 | **container** — card, dialog, popover, menu, command palette |
| `rounded-full` | | **circle** — avatar, status dot, switch, progress track |

**Nesting overrides role.** Inside a rounded box with padding `p`, the inner radius is `outer − p`:

| Outer | Padding | Inner |
| --- | --- | --- |
| `3xl` 24 | `p-2` 8 | `2xl` 16 |
| `2xl` 16 | `p-1` 4 | `xl` 12 |
| `xl` 12 | `p-1` 4 | `lg` 8 |

So a menu is `rounded-3xl p-2` with `rounded-2xl` rows, and a tab list is `rounded-xl p-1` with
`rounded-lg` tabs. **If role and nesting disagree, move the padding, not the radius.**

**A radius never reaches half the shortest side**, or the shape turns into a pill. A 16px checkbox is
`rounded-md`, not `rounded-lg`.

No `rounded-[…]`, `rounded-sm`, `rounded-xs` or bare `rounded`.

## Density — 40px controls

| Thing | Value |
| --- | --- |
| Control (button, input, select, toggle, tab list) | `default` **40px**, 16px label, 20px icon |
| Small control — inside a row, a table cell, a toolbar's second rank, **and the whole flow builder** | `sm` 36px, 14px label, 16px icon |
| Tiny control — inside a badge list or dense cell | `xs` 32px |
| Large control — auth pages only | `lg` 44px |
| Badge | 28px, `rounded-lg`, 14px |
| Checkbox, radio | 20px |
| Table | head row 48px, cells `px-3 py-3`, 14px, inside a card |
| Row in a card (`Item`) | `px-4 py-3.5`: 52px single line; rows in a group touch, with a hairline between |
| Card padding | 20px (`p-5`) everywhere |
| Dialog, sheet | 24px (`p-6`) for header, body and footer |
| Menu, select popup, command | `p-2` container, `rounded-2xl` rows |
| Popover | `p-4` |
| Icon in a control, menu row, rail item | `size-5` (the component sets it) |
| Icon beside meta text | `size-4` |

The primary action is the filled variant at the default size. A button never says `size="lg"` to look
important; `size="sm"` appears only inside rows, cells, a toolbar's second rank and the builder.

A call site does not pass `h-*`, `size-*`, `rounded-*` or padding to `Button`, `Input`, `SelectTrigger`,
`Badge` or `TabsList`. If no size fits, the component is missing a size, not the call site a class.

## Rhythm between blocks — 12 / 24 / 40

| Step | Between |
| --- | --- |
| **12** `gap-3` | parts of one block: label to control, title to hint, toolbar items |
| **24** `gap-6` | siblings: card to card, toolbar to table, header to first block |
| **40** `mt-10` | sections: a `SectionHeading` between two ideas |

If a gap fits none of the three, the blocks are not at the level of hierarchy the layout claims.

## Alignment

Alignment comes from the component's geometry, never from nudging one element.

- **One left edge per column.** The page title, the toolbar, a card's edge and a table's first cell start on the
  same gutter. Inside a card, text starts at the card's 20px padding, and so do a table's first and last cells
  (`first:pl-5 last:pr-5`).
- **Icons live in a fixed box.** An icon is `size-5` in a control or row and `size-4` beside meta text, so a
  column of icons lines up whatever the glyph. Never position one icon with a margin.
- **Single-line rows centre, multi-line rows top-align.** `items-center` for a row of one line; `items-start`
  for a row whose text can wrap, with the icon or avatar pinned to the first line (`h-lh`), so it does not drift
  to the middle of a paragraph.
- **The sidebar keeps its icons still.** The rail's icon sits 16px from the edge expanded or collapsed (8px group
  padding + 8px button padding), group labels and sub-items start on the label column (46px), so collapsing
  moves nothing but the labels.
- **Numbers are tabular and right-aligned** in tables and stat rows (`tabular-nums`), so digits line up.
- **Trailing actions share a right edge.** A header's actions, a row's menu and a card's action sit on the same
  right gutter as the content above them.
- **Space with `gap`, not margins.** A margin moves one element; a gap describes the relation between siblings,
  which is what alignment is. No negative margins.
- **Truncate, don't wrap, where rows must stay uniform.** `min-w-0` on the flex parent and `truncate` on the text
  (`TextWithTooltip` for anything a person may need to read in full).

## Page frame

Every page renders inside `Page` and starts with `PageHeader`.

| | Value |
| --- | --- |
| Gutter | `px-4` · `md:px-6` · `xl:px-8` |
| Header | title `text-3xl`, `pt-8 md:pt-12 xl:pt-16`, `pb-6`, actions on the right |
| Width | `full` (tables, lists, grids) or `narrow` = `max-w-3xl`, centred (settings, forms) |
| Bottom | `pb-12` |
| Blocks | `components/custom/page` (`Page`, `PageHeader`, `PageSection`, `Toolbar`) and `components/custom/panel` (`Panel`, `SettingRows`, `SettingRow`) |
| Detail pages | `PageHeader back={{ to, label }}` puts the way back above the title, so the title keeps the page's left edge |
| Full-height tables | `Page fill` lets a virtualized `DataTable` scroll inside itself instead of the page |

The shell is flat: the sidebar sits on `gray-2` with a hairline edge, the page on `gray-1`, cards on
`--panel`. There is no inset content card. The app and the platform admin share one sidebar
(`components/ui/sidebar`): 16rem wide, 3.25rem collapsed, 36px `rounded-xl` items with a 14px label and a 20px
icon. Dialogs that carry their own navigation use `DialogNav`, which draws the same items.

## Overlays

| | Sizes |
| --- | --- |
| Dialog | `size`: `sm` 448 · `md` 512 (default) · `lg` 672 · `xl` 896 · `xxl` 1152 |
| Sheet | `size`: `sm` 512 · `md` 576 (default) · `lg` 672 · `xl` 768 |

No arbitrary `max-w-[…]` or `w-[…]` on `DialogContent` or `SheetContent`. A sheet shows the detail of one
row; a dialog creates, confirms or deletes.

## Surfaces and edges

- A card is `bg-panel rounded-3xl shadow-edge`: a hairline, no drop shadow.
- `shadow-over` is for things that float: menus, popovers, dialogs, the bulk-action bar.
- Hairlines inside a card are `border-gray-6`; a control's border is `border-gray-7`.

## Enforcement

`npm run lint` in `packages/web` runs `scripts/check-tailwind-classes.mjs`, which fails on classes Tailwind
cannot generate and on the banned classes above: `text-xs`, `uppercase`, `rounded-sm`, `rounded-xs`, bare
`rounded`, `font-bold`, arbitrary `text-`/`leading-`/`tracking-`/`rounded-` values, and negative margins.

## Gotchas

- The `data-open:`, `data-checked:`, `data-active:` … variants the shadcn primitives use are declared as
  `@custom-variant` in `styles.css`, copied from `shadcn/tailwind.css`. They map to Radix's
  `data-state="…"`; without them the classes generate but never match.
- `DialogContent` and `SheetContent` set their width at `sm:`, so a `max-w-*` passed in `className` loses to
  it. Use `size`.
- Stock Tailwind: `rounded-md` is 6px and `rounded-lg` 8px. Code written before this contract meant 12px by
  `rounded-lg`.
