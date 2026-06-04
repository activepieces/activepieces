---
name: activepieces-design-system
description: Design system for Activepieces (open-source AI automation platform, "open source replacement for Zapier"). Use whenever designing, mocking, or building UI for Activepieces — the web app (flow builder, runs, connections, dashboard), docs, or marketing surfaces. Provides brand purple `#8142E3`, Inter type ramp with `sm` (14px) as body default, Tailwind neutrals, Lucide icons, Shadcn/Radix primitive conventions, the signature dotted-canvas builder background, and a recreated web UI kit.
---

# Activepieces Design System

You are designing for **Activepieces** — an open-source AI automation platform where users assemble triggers + actions from 280+ "pieces" into automated flows. Every piece doubles as an MCP server.

Read `README.md` in this folder **first** — it is the canonical reference. This file is a fast-loading summary for agent use.

## Inventory

- `README.md` — full spec (content fundamentals, visual foundations, iconography, caveats). Read first.
- `colors_and_type.css` — CSS tokens (colors, fonts, radii, shadows, spacing, type ramp). Import in every HTML file.
- `fonts/` — Inter 400/500/600/700/800 + `Sentient-Variable.woff2` (display alt, not used in app).
- `assets/logo.svg` — brand mark. Purple `#8142E3`.
- `assets/` — piece-tile SVGs (Shopify, Airtable, Google, OpenAI, Slack, Gmail) + MCP/code glyphs.
- `preview/` — ~700px-wide design-system cards (type, color, spacing, components).
- `ui_kits/web/` — high-fidelity recreation of the Activepieces web app. Entry `ui_kits/web/index.html`. Form-controls showcase at `ui_kits/web/forms.html`. Modular JSX via Babel standalone. Screens: Flows dashboard, Builder (dotted canvas + step panel), Runs table, Connections list, **Ask AI chat overlay** (Lottie-animated "thinking" loader at `assets/ai-loader.lottie.json`). Supports **light + dark mode** via `.dark` class on `<html>` — toggle lives in the sidebar footer.
- `insights/` — Interactive **Insights** page. Entry `insights/Insights.html`. Composes the `ui_kits/web/` shell (Sidebar, TopBar, Primitives, Overlays) and adds chart primitives in `InsightsCharts.jsx`: `Sparkline`, `LineChart` (multi-series + hover crosshair + tooltip), `BarChart` (stacked/grouped), `Donut`, `Heatmap` (days × hours). Page-scoped styles in `insights.css` define the `ins-*` class vocabulary (stat cards, AI summary card, quota meter, flow/error/team rows, piece grid, narrative hero). Two layout variations — **Classic dashboard** (hero stats + chart + donut + quota + top flows/errors + heatmap + team + live feed) and **Editorial** (dark narrative hero that tells the week's story + 3 highlight cards + heatmap/feed). Time range picker (24h/7d/30d/90d), compare-to-previous toggle, scope tabs (Workspace/Flow/Piece/Teammate), clickable stat cards, hover tooltips. **Tweaks**: layout (Classic ↔ Editorial), chart style (line/bar), AI summary on/off, density. Respects light/dark toggle.

### Component inventory (`ui_kits/web/`)

- **`Primitives.jsx`** — form & content building blocks:
  `Button` (default / secondary / outline / ghost / destructive / link; sizes xs / sm / default / lg / icon / icon-sm / icon-lg),
  `Badge` (default / secondary / outline / destructive / success / warning, optional `dot`),
  `Input` (with optional left `icon`, `thin` 32px variant),
  `Textarea` (auto-grows 1–5 rows),
  `Label` (supports `required` asterisk),
  `Checkbox` (supports `checked="indeterminate"`),
  `Switch` (optional checked/unchecked icons),
  `RadioGroup` + `RadioGroupItem`,
  `Slider` (single-thumb, 0..100 by default),
  `Progress` (0..100),
  `Skeleton`,
  `Avatar`, `Kbd`,
  `Alert` (default / primary / warning / destructive / success, with `icon` + `title`),
  `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` (default / pills / underline),
  `Separator` (horizontal / vertical).
- **`Overlays.jsx`** — portal-based floating surfaces, all with Esc + outside-click dismiss:
  `Popover` (anchored, placement + align + offset),
  `DropdownMenu` (items support `icon`, `shortcut`, `destructive`, `separator`, `disabled`),
  `Modal` (sizes sm / md / lg, `title` + `description` + `footer`, black/50 backdrop, no blur),
  `Tooltip` (400ms delay, 120ms fade),
  `ToastProvider` + `useToast()` + `ToastHost` (bottom-right stack; `.toast / .success / .error / .warning / .info`).
- **Screen views** — `Sidebar.jsx`, `TopBar.jsx`, `FlowsView.jsx`, `BuilderView.jsx`, `RunsView.jsx`, `ConnectionsView.jsx`, `AskAIView.jsx`, `Icons.jsx`.
- **Styling** — single `app.css` defines the `ap-*` class vocabulary and light/dark tokens. No build step.

## Hard rules (never violate)

1. **Primary is purple `hsl(257 74% 57%)` / `#8142E3`** — the shipping value from `packages/web/src/styles.css`. Not the `#9747FF` swatch some Figma files show. **Primary stays purple in dark mode** too (brand continuity) — use `.dark.blue-primary` to opt back into the repo's blue-in-dark behaviour.
2. **Body text is 14px (`text-sm`), not 16**. Activepieces feels dense and tool-like. Headings use `-0.01em` to `-0.02em` tracking.
3. **Sentence case everywhere**: headings, buttons, menu items, page titles. Proper nouns only for feature names (Flows, Runs, Pieces, MCP, Agents, Connections).
4. **Lucide icons only**, 1.5–2px stroke, rounded caps. Default size `16` (`size-4`). Icon + text → `gap-2` (8px). No emoji in the product UI. No Unicode glyphs (✓ × ←) — always a Lucide component.
5. **Borders are 1px**, color `neutral-200` (light) / `white/14` (dark). Never thicker. (Note: repo ships `white/10` in dark — we bump to `14%` so dividers stay readable against `neutral-900` surfaces.)
6. **No negative margins.** Use `gap-*`, `p-*`, `space-*`. Explicitly banned in the repo's AGENTS.md.
7. **Cards: white fill, 1px border, `radius-lg` (10px), NO shadow by default.** Shadows only on floating surfaces (popovers, menus, dialogs).
8. **Main content is a floating card**: the sidebar blends with the outer shell (`neutral-50` in light, `neutral-950` in dark); the content area sits inside with `radius-xl` (12px), 1px border, `shadow-xs`, and 8px inset from the viewport edges. Matches the shipping app layout.
9. **Builder canvas has the dotted look** — background `#FBFBFB` (light) / `#171717` (dark), radial-gradient dots `#b2b2b2 1px` at `16px 16px`. This is signature.
10. **Hover states darken only** — primary buttons go to `/90`, secondary `/80`, ghost `bg-gray-300/30`. No scale, no translate, no elevation change on hover or press.
11. **Focus-visible is a `3px` ring at `ring-color/50`** — accessibility-first, very visible.
12. **Disabled: `opacity: 0.5; pointer-events: none`.** No greyed-out variant.
13. **`cn()` from `@/lib/utils`** is mandatory for className composition in production-style code. Use design-token classes (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-md`), never raw hex.

## Voice & copy

Matter-of-fact, second-person, verb-first. No "Click here". No "Please". No hype.

- **Buttons**: "New flow", "Publish", "Connect", "Test step", "Save", "Run"
- **Empty states**: state the fact, then the action. *"No flows yet. Create your first flow to start automating."*
- **Do**: "Your flow is live.", "Add a step", "Connect your Google account"
- **Don't**: "Awesome! 🎉 Your flow is now live!", "Click here to add a step", "Please authorize Google"

## Quick-reference tokens

### Colors
```css
/* Primary */
--ap-primary:     hsl(257 74% 57%);   /* #8142E3 — the brand purple */
--ap-primary-100: hsl(257 75% 85%);   /* soft wash, selection, add-step glow */
--ap-primary-300: hsl(257 74% 25%);   /* deep accent, text on primary-100 */

/* Neutrals (Tailwind neutral) */
--ap-neutral-50:  #fafafa;
--ap-neutral-100: #f5f5f5;
--ap-neutral-200: #e5e5e5;   /* borders */
--ap-neutral-600: #525252;   /* muted text */
--ap-neutral-700: #404040;
--ap-neutral-900: #171717;
--ap-neutral-950: #0a0a0a;   /* body text, dark bg */

/* Semantics (only 500 used as solid) */
--ap-success:     hsl(160 84% 39%);  /* emerald */
--ap-destructive: hsl(350 89% 60%);  /* rose */
--ap-warning:     hsl(38 92% 50%);   /* amber */
```

### Type ramp (Inter)
| Token | Size | Usage |
|---|---|---|
| `xs` | 12px | metadata, badges |
| `sm` | 14px | **body default**, buttons, inputs |
| `base` | 16px | larger body |
| `lg` | 18px | card titles |
| `xl` | 20px | section titles |
| `2xl` | 24px | page titles |
| `3xl` | 28px | display (repo overrides from 30) |
| `4xl` | 32px | display (repo overrides from 36) |

### Spacing / radius / shadow
- Gap scale: **4, 8, 12, 16, 24, 32, 48, 64** (base 4px).
- Radii: `xs 2` / `sm 6` / `md 8` / `lg 10` / `xl 12`. Inputs & buttons = `md`. Cards & dialogs = `lg`.
- Shadows: `sm` `0 1px 3px rgba(0,0,0,0.06)` (cards that lift), `md` `0 10px 15px -3px rgba(0,0,0,0.08)` (menus). **No colored shadows** except the add-step button: `box-shadow: 0 0 0 6px var(--primary-100)`.

### Button variants
`default` (purple), `secondary` (near-black), `outline` (white + border), `ghost` (transparent), `destructive` (rose), `link` (underlined purple). Sizes: `xs 24` / `sm 30` / `default 36` / `lg 40` (height in px) + `icon` / `icon-sm` / `icon-lg` (square). Icon-only buttons: square with `radius-md`.

### Form controls (ships in `Primitives.jsx`)
- **Input** 36px default, 32px `thin`; supports left icon.
- **Textarea** auto-grows 1–5 rows.
- **Checkbox** supports `checked="indeterminate"` (shows `Minus` glyph).
- **Switch** 36×20px track, 20px thumb translates on check.
- **RadioGroup** / **RadioGroupItem** with context-driven selection.
- **Slider** single-thumb, filled track in primary.
- **Progress** `value` 0..100, indicator translates.
- **Alert** `default / primary / warning / destructive / success` with optional icon + title.
- **Tabs** `default` (boxed), `pills`, `underline` — use `pills` for segmented controls, `underline` for page-level nav.
- All controls respect the global focus-visible ring (`3px ring/50`) and the `opacity-50 / pointer-events-none` disabled pattern.

### Animation
- Default `200ms`, hover `150ms`. Custom ease: `cubic-bezier(0.35, 0, 0.25, 1)` (`--ease-expand-out`).
- **No bounces, no springs, no pop-scale.** Everything glides.

## Iconography

```html
<!-- Load Lucide via CDN when building HTML prototypes -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```
Or inline SVGs from https://lucide.dev. Piece/integration icons: copy the real SVG from `packages/web/src/assets/img/piece/` — do not redraw. Piece tile is 38–48px rounded-square with an 8% tinted background of the piece's brand color.

## Surfaces & layout

- Fixed 260px left sidebar, fluid content. Brand + workspace switcher top-left, user pill bottom-left, **theme toggle** (☀️/🌙) just above Settings.
- The content area is a **floating card** — 8px inset, `radius-xl`, 1px border, `shadow-xs`. Sidebar blends with the outer shell.
- Top bar only appears **inside the builder** (flow name + Test/Publish). Other screens use a page header with title + subtitle + actions.
- Max content width ~1400px; dense tables may break out wider.
- **Dialogs**: `radius-lg`, white, `shadow-md`, `black/50` overlay, no backdrop-blur.
- **Ask AI overlay**: centered sheet, 520px wide, conversational. Uses the Lottie loader (`assets/ai-loader.lottie.json`) while awaiting a response.

## Dark mode

- Toggle via `.dark` on `<html>`. Persist with `localStorage['ap-theme']`.
- Surfaces: outer shell `neutral-950`, floating card `neutral-900`, popovers/muted `neutral-800`, accent `neutral-700`.
- **Primary stays purple** (`hsl(257 74% 57%)`) — brand continuity. Opt back into the repo's blue-in-dark with `.dark.blue-primary`.
- Semantics lift from `-500` → `-400` for legibility on dark backgrounds (`success hsl(160 60% 52%)`, `destructive hsl(351 95% 72%)`, `warning hsl(43 97% 56%)`).
- Dividers: `hsla(0, 0%, 100%, 0.14)` — 14% white, bumped from the repo's 10% so borders stay readable against `neutral-900`.

## When to use the UI kit vs. build fresh

- **Use `ui_kits/web/` as your starting point** for any web-app screen (Flows list, Builder, Runs, Connections). Copy components, don't re-derive. It uses vanilla React + Babel standalone and a single `app.css` — no build step.
- **Tweak-compose**: match the CSS class vocabulary (`ap-page`, `ap-topbar`, `ap-btn`, `ap-badge`, `ap-side-item`, `ap-step`, `ap-canvas`, `ap-table`, `ap-trow`).
- **For production React code** targeting the real repo: write Tailwind v4 + Shadcn components and use `cn()`. The CSS variables in `colors_and_type.css` mirror the repo's `:root` tokens so values stay consistent.

## Known gotchas

- Figma file shows primary as `#9747FF`. **Ignore it.** Shipping primary is `#8142E3` (from `packages/web/src/styles.css` and the logo).
- The repo's dark mode shifts primary to **blue**. This system keeps primary **purple** in both modes for brand consistency; document the blue variant only if the user explicitly asks for dark-mode fidelity.
- `Sentient-Variable.woff2` is an *optional* display/marketing font — **not used in shipping product UI**. Only use if explicitly doing branding/marketing exploration.
- The Pro-Blocks Figma pages (Landing, Application, etc.) are Shadcn stock templates, not Activepieces marketing. Use as Shadcn pattern reference only.
- `packages/web` is the only shipping UI surface in the repo. There is no marketing-site code to reference.

## Starting a new design

1. Read `README.md` for depth.
2. Import `colors_and_type.css` in your HTML.
3. Load Inter (already in `fonts/`) and Lucide via CDN.
4. If building a web-app screen: open `ui_kits/web/index.html`, copy the relevant component file(s), and compose.
5. Use sentence case, 14px body, 1px borders, purple `#8142E3` only for primary action + brand. Nothing else.
