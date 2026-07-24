---
name: activepieces-design-system
description: Use whenever designing, mocking, or building UI for Activepieces — web app (flow builder, runs, connections, dashboard), docs, or marketing. Provides brand tokens, type ramp, and the recreated web UI kit.
---

# Activepieces Design System

Designing for Activepieces (open-source AI automation, "open source replacement for Zapier"). Read the skill folder's `README.md` first for depth; import `colors_and_type.css`; use `ui_kits/web/` as the starting point for any web-app screen (copy components, don't re-derive — vanilla React + Babel, no build step).

## Hard rules
1. **Primary purple `#8142E3`** (`hsl(257 74% 57%)`) — stays purple in dark mode too. Not `#9747FF`.
2. **Body text 14px (`text-sm`)**, not 16 — dense, tool-like. Headings track `-0.01`/`-0.02em`.
3. **Sentence case everywhere** (headings, buttons, menus). Proper nouns only for feature names (Flows, Runs, Pieces, MCP, Agents, Connections).
4. **Lucide icons only**, 1.5–2px stroke, size 16 default, `gap-2` to text. No emoji, no Unicode glyphs.
5. **1px borders**, `neutral-200` light / `white/14` dark. Never thicker.
6. **No negative margins** — use `gap/p/space`.
7. **Cards: white fill, 1px border, `radius-lg` (10px), NO shadow.** Shadows only on floating surfaces.
8. **Main content is a floating card** (8px inset, `radius-xl`, 1px border, `shadow-xs`); sidebar blends with outer shell.
9. **Builder canvas is dotted** — `#FBFBFB`/`#171717` bg, radial dots `#b2b2b2 1px` at 16px. Signature.
10. **Hover darkens only** (primary `/90`, secondary `/80`) — no scale/translate/elevation.
11. **Focus-visible: 3px ring at `ring/50`.**
12. **Disabled: `opacity:0.5; pointer-events:none`.**
13. **Use `cn()` + design-token classes** (`bg-primary`, `text-muted-foreground`, `border-border`) — never raw hex.

## Voice
Matter-of-fact, second-person, verb-first. "New flow", "Publish", "Connect". No "Click here", no "Please", no hype/emoji.

## Tokens
Type ramp (Inter): xs 12 / **sm 14 (body)** / base 16 / lg 18 (card titles) / xl 20 / 2xl 24 (page titles). Radii: inputs+buttons `md` (8), cards+dialogs `lg` (10). Semantics: success emerald, destructive rose, warning amber (500 solid; lift to 400 in dark). Animation 200ms default, no bounces/springs.

Full spec + UI kit in the repo: `.agents/skills/design/SKILL.md` (and its `README.md`, `ui_kits/web/`).
