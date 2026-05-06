# Activepieces Design System

A design system for **Activepieces** — an open-source AI automation platform ("an open source replacement for Zapier"). The product lets both technical and non-technical users build automated workflows with 280+ integrations ("pieces") and exposes every piece as an MCP server for use with Claude, Cursor, Windsurf, etc.

This folder contains the brand/visual foundations, CSS tokens, fonts, icon conventions, HTML preview cards for the Design System tab, and a UI kit that recreates core Activepieces product surfaces.

---

## Source materials

| Source | Location |
| --- | --- |
| Shadcn UI Kit for Figma + Pro Blocks (Oct 2025) | mounted `.fig` VFS — browse via `fig_ls /`, screenshot via `fig_screenshot` |
| Activepieces codebase | `github.com/yazeed-prog/activepieces` (`packages/web` is the React UI) |
| Canonical brand stylesheet | `packages/web/src/styles.css` (Tailwind v4 + Shadcn "new-york" style) |
| Brand logo | `packages/web/public/logo.svg` — purple mark `#8142E3` |
| Brand fonts | Inter (400/500/600/700/800) — provided in `uploads/` and `fonts/` |
| `Sentient-Variable.woff2` | provided as a display/display-alt exploration font (not used in shipping UI) |

Activepieces uses **Shadcn/Radix UI** primitives on top of Tailwind, with **Lucide** as its icon library (confirmed in `packages/web/components.json` → `"iconLibrary": "lucide"`). Shadcn base color is `"neutral"`.

---

## Index (what's in this folder)

- `README.md` — this file
- `colors_and_type.css` — CSS variables for colors, fonts, spacing, radii, shadows, type ramp
- `SKILL.md` — cross-compatible Agent Skill definition for reuse in Claude Code
- `fonts/` — Inter family (.woff2/.ttf) + Sentient variable
- `assets/` — `logo.svg` (brand mark), piece-tile SVGs
- `preview/` — ~700px-wide HTML cards that populate the Design System tab
- `ui_kits/web/` — UI kit for the Activepieces web app (builder, dashboard, sidebar, forms showcase)
- `insights/` — Interactive Insights page (`Insights.html`) with reusable chart primitives (`InsightsCharts.jsx`) and page-scoped styles (`insights.css`). Composes the `ui_kits/web/` shell + primitives; adds Sparkline / LineChart / BarChart / Donut / Heatmap. Two layout variations (Classic dashboard + Editorial narrative) switchable via Tweaks. Respects light/dark toggle.

### `ui_kits/web/` component inventory

The kit is plain React via Babel standalone — no build step. Single `app.css` defines the `ap-*` class vocabulary for both light and dark modes.

**Primitives** (`Primitives.jsx`):

| Component | Variants / sizes | Notes |
| --- | --- | --- |
| `Button` | `default / secondary / outline / ghost / destructive / link` × `xs / sm / default / lg / icon / icon-sm / icon-lg` | Matches Shadcn button API. Supports `loading`, leading/trailing slots. |
| `Badge` | `default / secondary / outline / destructive / success / warning` | Optional `dot`. |
| `Input` | default 36px, `thin` 32px | Optional left `icon`. |
| `Textarea` | auto-grow 1–5 rows | |
| `Label` | `required` flag adds red asterisk | Paired via `htmlFor`. |
| `Checkbox` | `checked = true / false / "indeterminate"` | `Minus` glyph on indeterminate. |
| `Switch` | optional `checkedIcon` + `uncheckedIcon` | Thumb translates 20px. |
| `RadioGroup` + `RadioGroupItem` | Context-driven selection | |
| `Slider` | single-thumb, 0..100 | Filled track in primary. |
| `Progress` | 0..100 | |
| `Skeleton` | — | Animated-pulse placeholder. |
| `Avatar` | `size`, `initials`, `src`, `color` | |
| `Kbd` | — | Inline keyboard-key chip. |
| `Alert` | `default / primary / warning / destructive / success` | Optional `icon` + `title`. |
| `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | `default / pills / underline` | |
| `Separator` | `horizontal / vertical` | |

**Overlays** (`Overlays.jsx`) — portal-based, all dismiss on Esc + outside click:

| Component | Notes |
| --- | --- |
| `Popover` | Anchored to trigger; `placement` + `align` + `offset`; clamps to viewport. |
| `DropdownMenu` | `items` support `icon`, `shortcut`, `destructive`, `separator`, `disabled`. |
| `Modal` | Sizes `sm / md / lg`; `title` + `description` + `footer`; `black/50` backdrop, no blur. |
| `Tooltip` | 400ms show delay, 120ms fade. |
| `ToastProvider` + `useToast()` + `ToastHost` | Bottom-right stack; `.toast / .success / .error / .warning / .info` helpers; auto-dismiss. |

**Screen views**: `Sidebar.jsx`, `TopBar.jsx`, `FlowsView.jsx`, `BuilderView.jsx`, `RunsView.jsx`, `ConnectionsView.jsx`, `AskAIView.jsx`, `Icons.jsx`.

**Entry points**: `ui_kits/web/index.html` (full app shell) and `ui_kits/web/forms.html` (form-controls showcase).

---

## Brand & product context

**Product**: Activepieces is an all-in-one AI automation platform. The core surface is a visual **flow builder** (React + XYFlow) where users assemble triggers + actions from 280+ open-source **pieces** into runnable flows. Every piece doubles as an MCP server, so LLM agents can call them directly.

**Audience**: mixed — "developers set up the tools, and anyone in the organization can use the no-code builder" (from README). Non-technical users live in the builder; developers contribute new pieces as typed npm packages.

**Products / surfaces represented in this design system**:
1. **Web app** (`packages/web`) — the authenticated product: flow builder, runs, connections, tables, agents, settings. This is the only UI in scope; the marketing site is not in the repo.

---

## CONTENT FUNDAMENTALS

Activepieces copy is **functional, direct, and product-led**. It talks about workflows, pieces, and runs in concrete terms — no marketing puffery inside the app.

- **Voice**: second-person ("**you** can build", "**your** flows"). Feature names and verbs lead; adjectives are rare.
- **Casing**: **Sentence case** for every UI string — headings, buttons, menu items, page titles. Proper nouns are the feature itself: "Pieces", "Flows", "Runs", "MCP", "Agents", "Connections".
- **Tone**: matter-of-fact and a little nerdy. The product README uses emoji headers (🤯 🔥 🧠 🛠️) but the *in-app UI does not* — inside the app, emoji are essentially absent and all iconography is Lucide.
- **Buttons**: verb-first, terse. "New flow", "Publish", "Connect", "Test step", "Run", "Save". No "Click here", no "Please".
- **Empty states / errors**: explain the state, then say what the user can do. Example pattern: *"No flows yet. Create your first flow to start automating."*
- **Microcopy examples (from repo strings & feature names)**: "Create a Piece", "Deploy", "Hot reloading for local piece development", "Chat Interface", "Form Interface", "Ask AI in Code Piece", "Human in the Loop".
- **Docs / README vibe**: slightly more playful, uses emoji section markers ("💖 Loved by Everyone", "🔒 Secure by Design"), short bullet explainers, bold lead-ins. Good for landing/docs — **not** for in-product UI.

**Do**: "Your flow is live.", "Add a step", "Connect your Google account"
**Don't**: "Awesome! 🎉 Your flow is now live!", "Click here to add a step", "Please authorize Google"

---

## VISUAL FOUNDATIONS

### Palette
- **Primary — Purple** `hsl(257 74% 57%)` ≈ `#8142E3`. Used for: primary buttons, the logo, active sidebar item, add-step affordance, selection glow in the builder, key links.
  - `--primary-100` `hsl(257 75% 85%)` for soft backgrounds / selection washes
  - `--primary-300` `hsl(257 74% 25%)` for deep accents
- **Neutrals**: Tailwind `neutral` scale (50→950). `950` is near-black (`#0a0a0a`), used for body text and the dark-mode background. The whole app reads as crisp **white + near-black** with purple as the only accent.
- **Semantics**: Emerald (`success` 160 84% 39%), Rose (`destructive` 350 89% 60%), Amber (`warning` 38 92% 50%). Only the 500 step is used for the solid colour; 50/100 are the soft fill for alerts/toasts; 700 is for high-contrast text on light chips.
- **Dark mode**: `neutral-950` background, `neutral-800` popovers/secondary, `hsla(0,0%,100%,0.1)` borders. In the shipping app primary *shifts to blue* in dark mode — we keep it purple by default in this design system for brand consistency, but document the blue variant.

### Typography
- **Inter** across the entire product (400 / 500 / 600 / 700 / 800). `font-feature-settings: 'rlig' 1, 'calt' 1`.
- **Display**: we also include **Sentient** (uploaded variable font) as an *optional* display/marketing alt. Not used in shipping product UI.
- **Ramp**: text-xss 10.4 / xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / **3xl 28** / **4xl 32** (the repo overrides 3xl/4xl to tighter sizes).
- **Body default is 14px (sm)**, not 16 — this is important. Dense, tool-like feel.
- **Headings** use `-0.01em` to `-0.02em` letter-spacing.

### Spacing & layout
- **Base unit 4px**. Gap scale: 4, 8, 12, 16, 24, 32, 48, 64.
- **Borders are 1px** everywhere, colour `neutral-200` (light) / `white/10` (dark). Never thicker.
- **Radius**: base `0.625rem` (10px). `lg` = 10, `md` = 8, `sm` = 6, `xs` = 2. Inputs + buttons use `md`; cards and dialogs use `lg`.
- **No negative margins.** Repo AGENTS.md bans them explicitly — use `gap` or `padding`.

### Surfaces
- Cards: white fill, 1px `neutral-200` border, `radius-lg`, **no shadow by default**. Shadow only on floating surfaces (popovers, dialogs, dropdowns).
- **The builder canvas** has a dotted pattern: background `#FBFBFB`, pattern dot `#b2b2b2`. This is a signature look.
- Shadows are subtle: `0 1px 3px rgba(0,0,0,0.06)` for cards-that-lift, `0 10px 15px -3px rgba(0,0,0,0.08)` for menus. **No coloured shadows** except the add-step button glow (`0 0 0 6px var(--primary-100)`).

### Animation
- Tailwind `tw-animate-css` is in. Custom easing: `--ease-expand-out: cubic-bezier(0.35, 0, 0.25, 1)`.
- Durations are short: **200ms default**, 150ms hover. Long-running animations (typing, highlight) are rare and intentional.
- Common keyframes in the repo: `accordion-down/up`, `fade`, `highlight` (primary-100 → secondary fade), `typing`, `slide-in-from-bottom`, `primary-color-pulse`.
- **No bounces, no springs**, no "pop" scale easing. Everything glides.

### States
- **Hover**: primary buttons darken to `/90`; secondary to `/80`; ghost buttons get `bg-gray-300/30`. Links underline. No scale, no elevation change.
- **Press/active**: same as hover — the product does **not** shrink or translate on press.
- **Focus-visible**: `3px` ring at `ring-color/50`, with `border-ring` — very visible, accessibility-first.
- **Disabled**: `opacity: 0.5`, `pointer-events: none`. No greyed-out variant swap.
- **Aria-invalid**: `border-destructive`, `ring-destructive/20`.

### Imagery & backgrounds
- **Minimal imagery** inside the product. No hero photos, no illustrations in the main app.
- **Piece tiles**: small rounded-square icons (48×48) with an 8% tinted background and the piece's own logo. Code piece uses amber `#E5AE43`, etc. Each piece owns its colour.
- Marketing/docs imagery (not in-app): screenshots of the builder with the dotted canvas, animated GIFs showing flow creation. No abstract gradients, no AI "bluish-purple glow" tropes — just the real UI.
- **No full-bleed photography** anywhere in the app.

### Transparency & blur
- Used very sparingly. Sidebar accent fill is `color-mix(in srgb, neutral-200 60%, transparent)` — a tinted translucent wash. Overlays on dialogs use `black/50`. **No backdrop-blur** in the shipping UI.

### Layout rules
- Fixed left sidebar, fluid content. Top bar only in the builder (it shows flow name + publish/test).
- Max content width ~1400px; dense tables break out wider.
- **`cn()` from `@/lib/utils`** is mandatory for className composition (clsx + tailwind-merge).

---

## ICONOGRAPHY

**Lucide** (https://lucide.dev) is the canonical icon set — confirmed via `components.json` (`"iconLibrary": "lucide"`). Stroke-based, 1.5px strokes, 24×24 viewBox, rounded line caps.

- **In HTML/JSX prototypes in this system, link Lucide from CDN**:
  ```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  ```
  Or use inline SVGs from https://lucide.dev. Sizes: default `16` (`size-4`), small `12` (`size-3`), large `20` (`size-5`).
- **Icon conventions**: icons sit left of text with 8px gap (`gap-2`). Ghost buttons and xs buttons get `size-3` icons, default `size-4`.
- **Piece icons**: each integration has its own SVG (Google, OpenAI, Slack, …). These live at `packages/web/src/assets/img/piece/` and as npm-published per-piece packages. **Copy the real SVG** — do not redraw.
- **Custom product glyphs**: a small set of custom SVGs for MCP, Cursor, Claude, Windsurf, auth providers. These live at `packages/web/src/assets/img/custom/`. We copy the MCP and code glyphs into `assets/`.
- **Emoji**: not used in product UI. Used lightly in the public README (🔥🤯🧠). Do not use in app.
- **Unicode icon chars** (✓, ×, arrows): not used — always a Lucide `<Check>`, `<X>`, `<ChevronRight>`.

---

## Tailwind + `cn()` conventions

Activepieces is a Tailwind v4 codebase. When generating production-style code off this system:
- Always `cn(...classes)` from `@/lib/utils` — never template literals for `className`.
- Use design-token class names (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-md`) not raw hex / raw radii.
- Ban negative margins. Use `gap-*`, `p-*`, `space-*`.
- Prefer extending existing `/ui` components before creating new ones.

---

## Caveats

- The **Pro-Blocks** Figma pages (Landing, Application, etc.) are Shadcn's stock templates and do NOT reflect the real Activepieces marketing site (which isn't in the repo). We use them as secondary reference for Shadcn patterns only.
- Figma file says primary purple is `rgb(151,71,255)` (`#9747FF`). The **actual shipping** primary per `styles.css` is `hsl(257 74% 57%)` ≈ `#8142E3` (matches the logo). We use the shipping value — the Figma swatch is a slightly lighter preview variant.
- **Sentient** (uploaded) is included as a display option but **is not used in shipping Activepieces UI**. Treat as optional branding exploration only.
