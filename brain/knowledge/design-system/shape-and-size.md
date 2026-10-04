---
icon: 📐
---

# Shape and size

One density, one radius ladder, one page frame. Every value is a stock Tailwind step: `styles.css`
redefines no radius and no font size. The primitives in `components/ui/` and the page blocks in
`components/custom/page` carry these values, so a call site almost never states a size, a radius or a
padding.

The density is **comfortable-compact**: 14px text and 36px controls like Linear or Vercel, with a little more air
between things. (A 16px/40px pass read as inflated; the strict compact pass after it read as packed, with density
varying page to page, so rows, cards, menus and page rhythm went up one notch while type and controls stayed.)

## Type — 14 body, 12 meta

| Role | Class | Where it lives |
| --- | --- | --- |
| Page title | `text-2xl font-semibold tracking-tight` | `PageHeader` |
| Section heading, dialog and sheet title | `text-base font-semibold` | `PageSection`, the primitive |
| Card, empty-state title | `text-sm font-semibold` | the primitive |
| Body | `text-sm` | buttons, inputs, menu items, labels, a row's title, table cells, prose, dialog descriptions |
| Meta | `text-xs` | a row's second line, hints under a field, timestamps, badges, tooltips, kbd, group labels |
| Figures | `text-2xl` / `text-3xl font-semibold` | stat tiles only |

**A line you read is body; a line you scan is meta.** Nothing is smaller than `text-xs`, and nothing is
`uppercase`: a group label is sentence case, `text-xs font-medium text-gray-11`. No arbitrary `text-[…]`,
`leading-[…]` or `tracking-[…]`: every named size carries its own line height.

Weights: `font-medium` for things you operate and a row's title, `font-semibold` for headings. No
`font-bold`.

## Radius — role, then nesting

**Role sets the radius of anything outermost.**

| Class | px | Role |
| --- | --- | --- |
| `rounded-md` | 6 | **small** — a 16px checkbox, a 24px badge, kbd, a 20px tile |
| `rounded-lg` | 8 | **control** — button, input, textarea, select trigger, tooltip, segment, sidebar item, dialog nav item |
| `rounded-xl` | 12 | **row / track / surface** — a menu row, a tab list, an inline banner, a small tile |
| `rounded-2xl` | 16 | **container** — card, dialog, popover, menu, command palette, table frame |
| `rounded-full` | | **circle** — avatar, status dot, switch, progress track |

**Nesting overrides role.** Inside a rounded box with padding `p`, the inner radius is `outer − p`:

| Outer | Padding | Inner |
| --- | --- | --- |
| `2xl` 16 | `p-1` 4 | `xl` 12 |
| `xl` 12 | `p-1` 4 | `lg` 8 |

So a menu is `rounded-2xl p-1` with `rounded-xl` rows, and a tab list is `rounded-xl p-1` with
`rounded-lg` tabs. **If role and nesting disagree, move the padding, not the radius.**

**A radius never reaches half the shortest side**, or the shape turns into a pill.

No `rounded-[…]`, `rounded-sm`, `rounded-xs`, bare `rounded`, or `rounded-3xl`.

## Density — 36px controls

| Thing | Value |
| --- | --- |
| Control (button, input, select, toggle, tab list) | `default` **36px**, 14px label, 16px icon |
| Small control — inside a row, a table cell, a toolbar's second rank, **and the whole flow builder** | `sm` 32px, 14px label, 16px icon |
| Tiny control — inside a badge list or dense cell | `xs` 28px, 12px label, 14px icon |
| Large control — auth pages only | `lg` 40px |
| Badge | 24px, `rounded-md`, 12px |
| Checkbox, radio | 16px |
| Table | head row 44px, cells `px-3 py-3` (48px rows), 14px, inside a card |
| Row in a card (`Item`) | `px-3 py-3`: 48px single line; rows in a group touch, with a hairline between |
| Card padding | 20px (`p-5`) everywhere |
| Dialog, sheet | 24px (`p-6`) for header, body and footer |
| Menu, select popup, command | `p-1` container, 36px `rounded-xl` rows, 16px icons |
| Popover | `p-3` |
| Sidebar | 15rem, 3rem collapsed, 36px `rounded-lg` items, 32px sub-items (see Page frame) |
| Icon in a control, menu row, rail item | `size-4` (the component sets it) |

The primary action is the filled variant at the default size. A button never says `size="lg"` to look
important; `size="sm"` appears only inside rows, cells, a toolbar's second rank and the builder.

A call site does not pass `h-*`, `size-*`, `rounded-*` or padding to `Button`, `Input`, `SelectTrigger`,
`Badge` or `TabsList`. If no size fits, the component is missing a size, not the call site a class.

## Rhythm between blocks — 8 / 24 / 40

| Step | Between |
| --- | --- |
| **8** `gap-2` | parts of one block: label to control, title to hint |
| **24** `gap-6` | blocks on a page: header to first block, toolbar to table, card to card (`Page`) |
| **16** `gap-4` | siblings inside a block: fields in a form, cards in a grid |
| **40** | sections: a `PageSection` between two ideas (it adds `mt-4` to the page's `gap-6`) |

If a gap fits none of the three, the blocks are not at the level of hierarchy the layout claims.

## Alignment

Alignment comes from the component's geometry, never from nudging one element.

- **One left edge per column.** The page title, the toolbar, a card's edge and a table's first cell start on the
  same gutter. Inside a card, text starts at the card's 20px padding, and so do a table's first and last cells
  (`first:pl-5 last:pr-5`).
- **Icons live in a fixed box.** An icon is `size-4` in a control or row and `size-3.5` beside meta text, so a
  column of icons lines up whatever the glyph. Never position one icon with a margin.
- **Single-line rows centre, multi-line rows top-align.** `items-center` for a row of one line; `items-start`
  for a row whose text can wrap, with the icon or avatar pinned to the first line (`h-lh`), so it does not drift
  to the middle of a paragraph.
- **The sidebar keeps its icons still.** The rail's icon sits 16px from the edge expanded or collapsed (8px group
  padding + 8px button padding), group labels and sub-items start on the label column (40px), so collapsing
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
| Header | title `text-2xl`, `pt-6 md:pt-8 xl:pt-10`, actions centred on it, on the right |
| Width | `full` (tables, lists, grids) or `narrow` = `max-w-3xl`, left-aligned on the same gutter as full pages (settings, forms) |
| Bottom | `pb-12` |
| Blocks | `components/custom/page` (`Page`, `PageHeader`, `PageSection`, `Toolbar`) and `components/custom/panel` (`Panel`, `SettingRows`, `SettingRow`) |
| Detail pages | `PageHeader back={{ to, label }}` puts the way back above the title, so the title keeps the page's left edge |
| Full-height tables | `Page fill` lets a virtualized `DataTable` scroll inside itself instead of the page |

The shell is flat: the sidebar sits on `gray-2` with a hairline edge, the page on `gray-1`, cards on
`--panel`. There is no inset content card. The app and the platform admin share one sidebar
(`components/ui/sidebar`): 15rem wide, 3rem collapsed, 32px `rounded-lg` items with a 14px label and a 16px
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
cannot generate and on the banned classes above: `uppercase`, `rounded-sm`, `rounded-xs`, bare
`rounded`, `font-bold`, arbitrary `text-`/`leading-`/`tracking-`/`rounded-` values, and negative margins.

## Gotchas

- The `data-open:`, `data-checked:`, `data-active:` … variants the shadcn primitives use are declared as
  `@custom-variant` in `styles.css`, copied from `shadcn/tailwind.css`. They map to Radix's
  `data-state="…"`; without them the classes generate but never match.
- `DialogContent` and `SheetContent` set their width at `sm:`, so a `max-w-*` passed in `className` loses to
  it. Use `size`.
- Stock Tailwind: `rounded-md` is 6px and `rounded-lg` 8px. Code written before this contract meant 12px by
  `rounded-lg`.
