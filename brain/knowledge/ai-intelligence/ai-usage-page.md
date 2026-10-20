---
icon: 📊
---

# AI Usage Page

The AI Center page (`/platform/ai/usage`) that answers one question: **where is my AI money going?** These choices came from a grill session on 2026-10-20 and shape every screen; the prototype lives on `feat/ai-analytics-ui`.

## Rules
- **One dollar unit.** Credits are converted at their dollar value; credits only appear as a note ("Includes 6,479 credits"). Never two units side by side.
- **Production by default.** Test runs (flow builder Test step, agent builder) get their own Testing section. A segmented **Production · All** control adds them to every number. Never a toggle switch.
- **Exact vs estimated stays out of the headline.** It shows only on a key's detail page (reported by provider vs estimated from list prices, plus the provider dashboard link), and as one footnote on the overview.
- **Overview, then drill down.** Every item opens its own detail page (`/platform/ai/usage/:dimension/:id`), and every card has See all (`/platform/ai/usage/:dimension`). Period and scope ride in the URL.
- **One detail template.** Header + the same chart + top 5 of the *other* dimensions + one extra card per type: project → monthly limit, flow → runs and cost per run, key → reported vs estimated, model → list price. A flow detail stops at flow level; there is no per-step split.

## Page anatomy
1. Hero: total for the period, change vs the previous period, line chart (this period solid, previous dashed), metric switch Spend · Calls · Tokens.
2. Tiles: month-end forecast (this month) or average per day, AI calls, tokens.
3. Bento of top-5 cards: projects, flows, agents, users, providers & keys, models; plus spend by source (donut), biggest changes, limits at risk.
4. Testing section, then the cost footnote.

## Key files
- `packages/web/src/app/routes/platform/setup/ai/usage-tab` — page, cards, and the dummy-data module (`usageDummyData`) until the read API lands
