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

**Seed colour** — a hex a platform picks. `primaryColor` seeds the accent scale and the grey tint; the optional
danger, warning and success colours (`themeColors.status`) each seed their own scale.

**Seed** — the four-key set `brandSeed` writes on `<html>` from a seed colour: for the brand `--brand-h`,
`--brand-c`, `--accent-9`, `--on-accent`; for a status scale `--danger-h`, `--danger-c`, `--danger-seed`,
`--on-danger-seed` (and the same for warning and success). Everything else derives from them in CSS.

**Mark** — a coloured shape carrying no text: a status dot, a meter, a progress bar. Step 11, except a
filled block such as a health bar, which is the solid, step 9.

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
- `packages/core/shared/src/lib/core/common/` — `brandColors.cssVariables` and `statusCssVariables` (compute the seeds; `lib/brand-seed.ts` writes them) and
  `swatchUtils`
- `packages/web/src/components/custom/logo-plate.tsx` — the one way to render a third-party logo
- `packages/web/src/lib/syntax-theme.ts` — the one place the code and JSON viewers pick a theme
