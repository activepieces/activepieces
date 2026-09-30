---
icon: 🎨
---

# Colour

Five scales of twelve steps, plus six exceptions. **There is no semantic layer**: the step number
*is* the meaning, in both themes, and the table below is the contract.

```
--gray-1 … --gray-12       the neutral, tinted toward the brand hue
--accent-1 … --accent-12   the brand
--success- / --warning- / --danger- 1 … 12
```

| Step | Job |
| --- | --- |
| 1 | app background — and ink on an inverse ground |
| 2 | subtle background — the sidebar, the flow canvas |
| 3 | component background — a badge, a chip, a tinted banner |
| 4 | that component, hovered |
| 5 | that component, active or pressed |
| 6 | subtle border — dividers and hairlines |
| 7 | component border |
| 8 | strong border, and the focus ring |
| 9 | solid fill — a button, a filled shape; and, on `gray` only, the one ink allowed to be quiet, for decoration that owes 3:1 rather than 4.5:1 (a chevron, an empty-state glyph). `accent-9` is the tenant's hex, so it owes nothing as ink |
| 10 | defined, but no call site uses it: a solid hovers as step 9 at 90% opacity, because `accent-9` is the tenant's hex and step 10 is not derived from it |
| 11 | low-contrast text, **and every thin coloured mark** — status dots, meter lines; a filled block such as a health bar is step 9 |
| 12 | high-contrast text |

Steps **1 and 12 are an inverse pair**: `bg-gray-12 text-gray-1` is a dark chip in light mode and a
light chip in dark mode, correct in both, with no `dark:`. `inverse`, the focus ring, the canvas and the
divider need no names: they are `gray-12`, `accent-8`, `gray-2` and `gray-6`. A hover is stronger than
the thing it hovers: a row on the page hovers to `gray-3` or `gray-4`, a `gray-3` component to `gray-4`. A
chip inside a row that hovers or selects sits on `gray-5`, so neither state swallows it.

A thin mark (a dot, a meter line) is step 11, because step 11 already owes 4.5:1 on every ground in both
themes and matches the label beside it. A filled block, such as a health bar, is step 9: at that size
step 11 reads dark in light mode and washed out in dark, and the solid is what the block is.

## The six exceptions

Each exists *because* no step can do its job. A new one has to pass the same test: if a step, or a step
inside an island, can do it, it is not an exception.

| Token | Why it cannot be a step |
| --- | --- |
| `--panel` | elevation runs opposite ways: a raised surface is whiter than the page in light and lighter in dark |
| `--on-accent` | `accent-9` is the tenant's hex, so the label on it is measured at runtime — white for a violet brand, black for a yellow one |
| `--on-success` `--on-warning` | dark in both themes: `success-9` and `warning-9` are bright solids in light and dark, and no step is dark in both |
| `--on-danger` | white in both themes; `gray-1` measures under 4.5:1 on the dark `danger-9` |
| `--scrim` | black at an alpha in both themes; not a member of any scale |

`success-9` and `warning-9` are bright in both themes, so the health bars read as green and amber; in light mode `warning-9` is lighter than `warning-8`, the one place a light ramp is not monotonic.

In light mode the page (`gray-1`) is very slightly tinted and panels are pure white, so a card lifts off
the page by a 1.05:1 step. That is designed, not a patch.

## Light and dark

Light and dark are **authored independently**; dark is not an inversion of light, because an inverted
ramp crowds the dark steps together. Dark mode is the `[data-theme='dark']` binding block in `styles.css`,
not overrides in components.

## White-labelling

A platform's `primaryColor` drives the brand. `brandColors.cssVariables` turns it into a
**fixed four-key seed** written on `<html>` in both themes: `--brand-h`, `--brand-c`, `--accent-9` (the
tenant's hex, with a `#` added if it was missing) and `--on-accent` (white or black, whichever measures higher against it). The rest
of the accent scale and the grey tint derive from hue and chroma in CSS, through plain `var()` inside
`oklch()` — no relative colour syntax. The three status hues are literals: a tenant's purple must not tint
the danger red. A black, grey or white brand colour has no hue, so it gets `--brand-c: 0` and
the accent scale and grey tint render neutral. Each colour in the *Colors* block has a live preview card under its picker (its button and key steps); one Light/Dark switch in the block header flips every card, and a label under 4.5:1 is flagged (`color-preview.tsx`).

An admin can also **seed each status scale**: danger, warning and success, set under Platform → General →
*Colors* and stored in `themeColors` as `danger`, `warn.default` and `success.default`.
`brandColors.statusCssVariables` gives each chosen hex the same four keys (`--danger-h`, `--danger-c`,
`--danger-seed` for step 9, `--on-danger-seed` for its label); a scale with no seed keeps its stock values,
because every seeded step falls back to them. Only the lightness ladder is ours, so step 11 keeps 4.5:1 at
any hue: `test/styles/status-scales.test.ts` sweeps every hue in both themes. The status hues are still
never *derived* from the brand. Only an explicit seed moves them. The `theme` flag serves the seeds as
`statusColors`, leaving out the old pre-filled defaults (`#f94949`, `#f78a3b`, `#14ae5c`) that the previous
form saved without the admin choosing them. The other `themeColors` fields are accepted and stored but not rendered.

## Categorical colour

A scale answers *"what does this mean?"*. For *"which one is this?"* — projects, notes, avatars, chart
series, tag categories — use the twelve-hue swatch set: `swatch-1` … `swatch-12`, each with `-mark`,
`-surface`, `-ink`, `-line` and `-on`. Every member is solved to the same contrast (3.2:1 on white for a
mark) under a shared chroma ceiling, rather than to the same lightness and chroma, and a
`@media (color-gamut: p3)` block re-runs the solve against the wider gamut, so most hues gain chroma and
the sRGB-starved ones (teal, cyan, blue) gain the most.

Store the **name** (`ColorName.YELLOW`), never the rendered value, so the value is free to differ per
theme. A name maps to the same swatch for projects (`PROJECT_COLOR_SWATCH`) and notes. There are four warm
names and three warm swatches, so `ORANGE` and `DEEP_ORANGE` share swatch 5 and no name uses swatch 7; `PICKABLE_COLOR_NAMES` leaves `DEEP_ORANGE` out of the pickers so
they show no duplicate. Charts sample swatches 1, 5, 9, 3 and 7 through `--chart-1..5`. `swatchUtils.varsForSeed` picks a swatch deterministically from any string.

## Logos

**`<LogoPlate>` is the way to render a logo we did not make in a list, picker or card.** The sign-in
provider icons (Google, SAML) are drawn for both grounds, and a tenant's own uploaded logo renders as-is. It is a
light island (`data-theme="light"`, `bg-gray-1`, `text-gray-12`), so the chip stays light and a black mark stays visible in
dark mode; a fallback glyph or monogram inside it inherits the dark `gray-12`. A border or ring passed in `className`
resolves in the island's light values. `className` styles the plate and `innerClassName` the box that holds the image
inside it (a percentage padding would resolve against the plate's *parent*). `PieceIcon` is a tooltip wrapper
over it.

Our *own* logo is not a plate: `activepieces-wordmark.tsx` inlines it so the lettering is `currentColor`.
It renders only while the platform uses the stock logo; an uploaded logo renders as-is.

`ImageWithFallback` splits its props across two elements: `className` is the box (size, radius, ring —
the wrapper clips) and `imageClassName` the image. On failure it renders a monogram from `alt` with
`role="img"`, and the error clears when `src` changes.

## Where raw colour is allowed

- **Shadows** — the alpha casts in the `--shadow-*` tokens and the few hand-written `shadow-[…]` values. A
  shadow is darkness at an alpha, not a member of any scale.
- **PNG exports** — `EXPORT_BACKGROUND` in `impact-utils.ts` and the fallback in
  `flow-screenshot-utils.ts`. A downloaded image wants a light ground whatever the theme.
- **Illustration** — the doodle palettes in `flow-build-card.tsx`, the window-button dots in
  `tool-shimmer-pills.tsx`, and `#fff` stops inside SVG luminance masks, which must be white to work as masks.
- **Colour-picker defaults** — stored data, not UI colour.
- **User-content previews** — `bg-white` on the SVG and HTML preview frames, which render content
  authored against a white page.
- **The wordmark's mark** — keeps the literal Activepieces purple; the lettering is `currentColor`.
- **The builder minimap** — fills each block with the average colour of its step's logo, so a long flow
  stays readable at thumbnail size. It composites through `--panel` and falls back to `--gray-11`. This is
  the only place colour is still sampled from an image; do not add another.
- **Older effects** — the `.recurring-chip`, gradient-border and note-scrollbar colours in `styles.css`, and
  the sheen, shimmer and ripple glows in `tag-with-bright.tsx`, `automatic-trial-activation.tsx`,
  `automations-empty-state.tsx` and `theme-provider.tsx`. They predate the scales and read the same in both
  themes; move one onto steps when you next touch it.

## Rules

- **No `dark:` colour utility in application code** (`dark:bg-`, `dark:text-`, `dark:border-` …). If the
  system works, one is either redundant or a bug. It is legal in `src/styles.css` and in the shadcn
  primitives under `src/components/ui/`. A `dark:` on something tokens cannot express, like an opacity,
  is fine. So is a `dark:` that cancels a primitive's own `dark:` tint on a bare use (the chat answer
  `Input`, the time and AM/PM segments, the sign-in fields): nothing else outranks the primitive's `dark:`.
- **Dark mode is `[data-theme='dark']` on `<html>`, not a `.dark` class.** Anything injecting a
  theme-scoped selector at runtime must use the attribute — see `THEMES` in `components/ui/chart.tsx`.
- **A surface that is light in both themes is a light island** — `data-theme="light"`, then ordinary steps
  inside. `<LogoPlate>` and the plan card are the two.
- **A surface that is dark in both themes is a dark island** — `data-theme="dark"` on it, then ordinary
  steps inside (the terminal, the function tooltip, anything on `--scrim`). Never `bg-gray-12`: that is the
  inverse ground, near-white in dark mode, and step 11 is not tuned for it. The seed defaults sit on `:root`
  only, so an island keeps the tenant's brand (the appearance form previews every seed live on `<html>`, so its preview islands inherit it); `dark:` resolves to the nearest island, one level deep.
- **Read `resolvedTheme`, never `preference`,** to decide what something looks like. `preference` can
  be `'system'`, and comparing it to `'dark'` is how the code editors ended up light in a dark app.
- **Never tint a surface or border with a solid at an opacity.** `bg-accent-9/10` is `accent-3` and `border-danger-9/40` is
  `danger-7`: use the step. A solid's own hover (`bg-accent-9/90`) is fine, and so is an opacity on an ink
  (`text-gray-12/80` is a prominence no step provides). A translucent *neutral* (`bg-gray-3/50`,
  `border-gray-6/60`) is tolerated where it already exists; new code picks a step. Rings,
  glows and overlays that must show what is under them (focus and invalid rings, the canvas selection box)
  are not surfaces, and the `src/components/ui/` primitives keep their shadcn idioms.
- **An invalid field's border is `danger-9`** (`aria-invalid:` in the primitives). Step 8 falls under 3:1 on
  the light page, and an error has to read at least as strongly as the default border. Banners and badges
  keep their step-7 frame.
- **A selected item's border is on the accent scale** (`accent-7` to `accent-9`); a neutral selection (a
  filter chip, an inverse `gray-12` box) stays neutral. Other borders stay on 6–8.
- **The stock Tailwind palette still resolves.** Not using it is a convention, not a build error.
