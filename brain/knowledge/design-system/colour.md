---
icon: 🎨
---

# Colour

Five scales of twelve steps, plus six exceptions. **There is no semantic layer**: the step number
*is* the meaning, in both themes, and the table below is the contract.

```
--gray-1 … --gray-12       the neutral, pure grey whatever the brand
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
| 9 | solid fill — a button, a filled shape, a progress bar, a chart series, a status dot; and, on `gray` only, the one ink allowed to be quiet, for decoration that owes 3:1 rather than 4.5:1 (a chevron, an empty-state glyph). `accent-9` is the tenant's hex, so it owes nothing as ink |
| 10 | a small mark that has to be seen on its own — a status dot, a step-complete line. It keeps 3:1 on the page in both themes for any seed, which step 9 (the admin's own colour) cannot promise |
| 11 | low-contrast text, and icons that sit in a line of text (a trash icon, a warning triangle) |
| 12 | high-contrast text |

Steps **1 and 12 are an inverse pair**: `bg-gray-12 text-gray-1` is a dark chip in light mode and a
light chip in dark mode, correct in both, with no `dark:`. `inverse`, the focus ring, the canvas and the
divider need no names: they are `gray-12`, `gray-8`, `gray-2` and `gray-6`. A hover is stronger than
the thing it hovers: a row on the page hovers to `gray-3` or `gray-4`, a `gray-3` component to `gray-4`. A
chip inside a row that hovers or selects sits on `gray-5`, so neither state swallows it.

Colour that is a *shape* rather than text is a solid. A fill — a progress bar, a chart line or area, a health
bar — is step 9. A small status dot is step 10, which the generator keeps at 3:1 on the page even when an admin
picks a pale colour. Step 11 is a text shade: drawn as a dot or a bar it reads dark and dead, so it stays for text
and for icons inside a line of text.

## The six exceptions

Each exists *because* no step can do its job. A new one has to pass the same test: if a step, or a step
inside an island, can do it, it is not an exception.

| Token | Why it cannot be a step |
| --- | --- |
| `--panel` | elevation runs opposite ways: a raised surface is whiter than the page in light and lighter in dark |
| `--on-accent` | `accent-9` is the tenant's hex, so the label on it is measured at runtime — white for a violet brand, black for a yellow one |
| `--on-success` `--on-warning` | dark in both themes: `success-9` and `warning-9` are bright solids in light and dark, and no step is dark in both. With a status seed, it is measured against the seed like `--on-accent` |
| `--on-danger` | white in both themes; `gray-1` measures under 4.5:1 on the dark `danger-9`. With a status seed, it is measured against the seed like `--on-accent` |
| `--scrim` | black at an alpha in both themes; not a member of any scale |

Every coloured scale (accent, success, warning, danger) comes from one generator, `brandColors.ramp`
(`@activepieces/shared`). Given a hex, it finds the nearest of our colour families by hue and walks that family's shades:
light steps 1–12 are the shades `25 50 100 150 200 250 300 400 · 600 700 900` (step 9 is the hex itself), dark
steps 1–8 use the family's 950–700 hue and chroma on a deep ladder (`14 17 20.5 24 27.5 31 38 47`), and dark 10–12
are 400, 300 and 100. The family's hue drift and chroma follow the hex, so a custom teal behaves like our teal.
Step 11 is then lowered (light) or raised (dark) until it reads 4.5:1 on every ground and on its own tint, and step
10 until it reads 3:1 on the page. The defaults in `styles.css` are this generator's output for violet (`#6e41e2`),
red, amber and green; `status-scales.test.ts` fails if
the CSS and the generator drift apart.

`success-9` and `warning-9` are bright in both themes, so the health bars read as green and amber; in light mode `warning-9` is lighter than `warning-8`, the one place a light ramp is not monotonic.

In light mode the page (`gray-1`) is an off-white and panels are pure white, so a card lifts off
the page by a hair (about 1.02:1); borders and shadows carry the rest. That is designed, not a patch.

## Light and dark

Light and dark are **authored independently**; dark is not an inversion of light, because an inverted
ramp crowds the dark steps together. Dark mode is the `[data-theme='dark']` binding block in `styles.css`,
not overrides in components.

## The greys are not tinted, and they are light

The grey scale never takes the brand hue. Every step is a literal `oklch(L% 0 0)`, so every
grey is a true neutral in both themes and sits beside any tenant's colour without turning the whole UI purple, green
or blue. The brand reaches the UI only through the accent scale.

Each grey step's lightness is anchored on the token its call sites used before the step system (sidebar `98.2%`,
chip `97%`, border `92.2%`, muted text `52%`, strong text `16%` in light), so the app keeps its old weight. Step 11
sits at the lightest value that still reads 4.5:1 on every chip ground; do not lighten it further.

Dark follows the same rules as light: neutral greys, and swatches from the same colour families. Its greys
are deep (`gray-1` 11%, `gray-2` 16.2%) so the sidebar, page and panels separate. Its swatch marks are the family's
500 at 80% chroma with the family's 950 as the label, calmer than light mode's 600 on a near-black ground.

## White-labelling

A platform's `primaryColor` drives the accent scale; the optional danger, warning and success colours
(`themeColors.status`, served by the `theme` flag as `statusColors`) each drive their own scale. They are never
derived from one another. `brandColors.cssVariables` and `brandColors.statusCssVariables` run the generator on the
chosen hex and write every step for both themes on `<html>` (`--accent-light-3`, `--accent-dark-3`, …), plus the
label (`--on-accent`, `--on-danger-seed`, …: white or black, whichever measures higher). Each theme block reads
`--accent-3: var(--accent-light-3, <stock value>)`, so a platform with no colour chosen gets the stock ramp and an
island (`data-theme`) picks its own theme's half. A black, grey or white colour renders a neutral ramp. Each colour
in the *Colors* block has a live preview under its picker (`color-preview.tsx`). The seeds live under their own key
because the previous form wrote `danger`, `warn` and `success` with pre-filled defaults the admin never chose; those
fields, like the rest of `themeColors`, are kept as stored and never rendered.

## Categorical colour

A scale answers *"what does this mean?"*. For *"which one is this?"* — projects, notes, avatars, chart
series, tag categories — use the twelve-hue swatch set: `swatch-1` … `swatch-12`, each with `-mark`,
`-surface`, `-ink`, `-line` and `-on`, all generated by `brandColors.swatches()` from one of our colour families
(purple, fuchsia, pink, red, orange, yellow, lime, green, emerald, cyan, blue, indigo). The mark is the most vivid
shade whose label still reads at 4.5:1: the 500 with the family's own 950 as the letter where that reads (the warm
and green families), otherwise the 600 with a white letter. Dark mode takes a calmer 500/400 at 85% chroma with the
950 letter. The surface, line and ink are the same steps the ramps use (3, 5 or 7, and 11), so swatch text reads at
4.5:1 on its own tint. The CSS values are the generator's output, and `status-scales.test.ts` fails if they drift.

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

- **`tint` gives the plate a flat wash of the logo's own colour** (`lib/logo-tint.ts`). The logo is loaded once with
  CORS, sampled at 24px, and its visible, *coloured* pixels are averaged in OKLab, weighted by chroma, so white and
  transparent areas do not dilute it and a dark but colourful logo (Slack) still counts. Fewer than 8% coloured
  pixels means no tint (GitHub, OpenAI). The tint is always `oklch(96.5% 0.022 <hue>)`: one lightness and chroma
  for every logo, so no piece reads louder than another. The plate is a light island, so it is the same in dark
  mode, which is what broke the old `ImageWithColorBackground` (it mixed with `#fff` on a themed ground). A host
  without CORS just gets no tint; the logo still renders. On for `PieceIcon` and canvas step logos.

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
  one of two places colour is sampled from an image; the other is the piece-logo tint (`lib/logo-tint.ts`). Do not add a third.
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
  inverse ground, near-white in dark mode, and step 11 is not tuned for it. A chosen colour is written on `<html>` as
  both themes' values, so an island keeps the tenant's brand and picks its own theme's half; `dark:` resolves to the nearest island, one level deep.
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
- **The focus ring is neutral: `ring-gray-8` / `border-gray-8`, never `accent-8`.** Embedded tenants see
  their brand on every focused control otherwise. A ring that marks a brand-coloured selection (the active
  OTP cell) may stay on the accent scale.
- **A selected item's border is on the accent scale** (`accent-7` to `accent-9`); a neutral selection (a
  filter chip, an inverse `gray-12` box) stays neutral. Other borders stay on 6–8.
- **The stock Tailwind palette still resolves.** Not using it is a convention, not a build error.
