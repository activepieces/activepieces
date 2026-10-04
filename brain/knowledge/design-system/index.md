---
icon: 🎨
---

# Design System

How the web app's visual language is defined. Colour is fully specified on its own page, *colour*;
this page is the glossary around it.

**Step** — a position 1–12 in a colour scale. The number *is* the meaning, in both themes; there are no
semantic aliases. See *colour* for the job of each step. _Avoid_: "token" for a step, "shade", "ramp step"

**Scale** — one of the five twelve-step ladders: `gray`, `accent`, `success`, `warning`, `danger`.
_Avoid_: "palette" (that is the swatch set), "ramp"

**Exception** — one of the six named tokens that exist because no step can do their job (`--panel`,
`--on-accent`, `--on-success`, `--on-warning`, `--on-danger`, `--scrim`).

**Seed colour** — a hex a platform picks. `primaryColor` seeds the accent scale (the greys stay neutral); the optional
danger, warning and success colours (`themeColors.status`) each seed their own scale.

**Ramp** — the twelve steps of one scale for both themes, generated from a seed colour by `brandColors.ramp`
(nearest colour family, contrast-checked steps 10 and 11). `brandSeed` writes a chosen colour's ramp on `<html>`
as `--accent-light-N` / `--accent-dark-N` (and the same for danger, warning, success); the CSS defaults are the
generator's output for the stock colours.

**Mark** — a coloured shape carrying no text. A small status dot is step 10; a fill such as a progress bar,
meter or chart series is step 9.

**Swatch** — the twelve-hue *categorical* set (`swatch-1` … `swatch-12`), for "which one is this?"
rather than "what does this mean?" — projects, avatars, chart series. Not a scale.

**Plate** — the light chip a third-party logo sits on. It is a light island, so it stays light in both
themes, because we cannot recolour someone else's artwork. `<LogoPlate>` renders one.

## Gotchas

- `styles.css` points the `--shadow-*` theme keys that change per theme at a plain custom property
  (`--shadow-edge: var(--edge)`). Tailwind copies a `--shadow-*` value into the utility literally, so a dark override of
  the theme key itself never lands; the indirection is what lets shadows change per theme.
- `PROJECT_COLOR_PALETTE` in `@activepieces/shared` reads `--swatch-N-on` through JS, not a Tailwind
  class, so grepping for the class says it is dead when it is not.
- Tailwind emits nothing for an unknown utility, and an unresolvable `var()` makes its declaration invalid, so a
  removed colour token never fails the build. Web lint does: `scripts/check-tailwind-classes.mjs` fails on any class
  Tailwind cannot generate and any `var()` that nothing defines.

## Key files

- `packages/web/src/styles.css` — the scales, exceptions, swatches and both theme blocks
- `packages/core/shared/src/lib/core/common/` — `brandColors.ramp`, `cssVariables` and `statusCssVariables` (generate the ramps; `lib/brand-seed.ts` writes them) and
  `swatchUtils`
- `packages/web/src/components/custom/logo-plate.tsx` — the one way to render a third-party logo
- `packages/web/src/lib/syntax-theme.ts` — the one place the code and JSON viewers pick a theme
