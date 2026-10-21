---
icon: 📊
---

# AI Usage Page

The AI Center page (`/platform/ai/usage`) that answers one question: **where is my AI money going?** These choices came from a grill session on 2026-10-20 and shape every screen; the prototype lives on `feat/ai-analytics-ui`.

## Rules
- **One dollar unit.** Credits are converted at their dollar value; credits only appear as a note ("Includes 6,479 credits"). Never two units side by side.
- **Three scopes, one page.** A scope select whose options each carry an icon and a one-line description, in this order: **All** · **Production** (the default) · **Testing** (flow builder Test step and agent builder). No amounts on it. The whole page follows it. No separate testing section, never a toggle switch.
- **Controls sit in the header, right of the title**, on every usage page: scope select and period select (labels only, no date ranges), both styled like outline buttons. No export on the page.
- **Every row has two lines, so all cards share one row height.** Line two is the parent (a flow's project, a model's or key's provider), a project's flow and agent counts, or "Billed on your plan" for credits. Every key row keeps the same right-hand button slot, so the bars line up: external dashboard, or billing for credits.
- **No project spend limits.** Dropped on 2026-10-21 to keep the feature simple to build and maintain: no cap, no limits card, no Set limit dialog.
- **Credits are always "Activepieces credits" with the Activepieces logo**, wherever the analytics mention them.
- **See all is a list card, not a data table.** Search sits inside the card. Column headers are quiet text that sorts on click, with an arrow only on the active column. Numbers are right-aligned, and the name column takes the free width. The share bar sits under the name. Change, calls and tokens hide on small screens. Pagination is page by page: "1–25 of 134" on the left, previous / "Page 1 of 6" / next on the right, back to page 1 on search or sort. A "Show more" button was tried and dropped.
- **Exact vs estimated stays out of the headline.** It shows only on a key's detail page (reported by provider vs estimated from list prices, plus the provider dashboard link), and as one footnote on the overview.
- **Overview, then drill down.** Every item opens its own detail page (`/platform/ai/usage/:dimension/:id`), and every card has See all (`/platform/ai/usage/:dimension`). Period and scope ride in the URL.
- **Costs are marked as estimates where the money is, not in the subtitle.** A quiet "Estimated" link sits next to the hero's Spend label (hidden for calls and tokens, which are exact) and opens a "Why these numbers are estimates" popover: providers mostly return tokens, not cost; discounts, caching, batch rates and price changes shift the real bill; reported costs are used as is; Activepieces credits are exact; the provider dashboard is the billing truth. Putting the caveat first in the page header made the whole page read as untrustworthy (dropped 2026-10-21).
- **The title is the breadcrumb.** List: "AI usage / Users". Detail: "AI usage / Users / Maya Chen", whatever page you came from, so one click reaches the list. There is no back link above the title and no type badge; the period and scope carry over in every crumb.
- **One detail template.** Header + the same chart + top 5 of the *other* dimensions + one extra card per type: project → spend with its flow and agent counts, flow → runs and cost per run, key → reported vs estimated, model → list price. A flow detail stops at flow level; there is no per-step split.

- **"Previous period" means the same span right before**, except month views: "This month" and "Last month" compare with the same days of the month before (Oct 1–20 vs Sep 1–20). The chart legend shows both ranges, and the read API has to use the same rule.

- **Never compare against a period that isn't fully tracked.** If tracking started after the previous period began, every change % (hero, cards, lists) is hidden and the hero says so; a partial comparison would show fake growth like +400%. If tracking started inside the current period, the chart starts at that date and a note says "covers 25 of 90 days".

- **Every bar says what it is a share of.** Overview bars are a share of all AI spend in the period; detail-page bars are a share of that item's spend. Each bar shows its % and a tooltip that names the whole.

## Data hierarchy
- **Root: the platform**, which is the bill. Scope (Production / Testing / All) and period filter the whole page; they are not levels.
- **Tree 1, where the money is spent:** platform → project → flows · agents · chat by user. Project is the parent because project admins and ownership live there.
- **Tree 2, what it is spent on:** platform → provider → key → model. Keys are platform-owned and shared across projects, so they never sit under a project.
- **Side views, not levels:** user (who; only chat and agent runs have one) and source (what kind of work, an overlay on tree 1).
- **Detail pages pivot to the other tree:** a flow shows its models and keys, and a key shows its projects and flows.
- **A Run Agent step counts under both its flow and its agent**, marked Shared, so flows + agents can add up to more than the project total. Decided 2026-10-20. A two-tree overview layout was tried as "Usage v2" and dropped the same day: the overview keeps flat top-5 cards, and the trees only shape the detail-page pivot.

## Page anatomy
1. Tiles: a pace tile that follows the period (1h–24h → daily run rate; 7–90 days and last month → average per day; this month → month-end forecast with the date and daily pace it is based on), AI calls, tokens. Never label a projection as an average.
2. Hero: total for the period, change vs the previous period, line chart (this period solid, previous dashed), metric switch Spend · Calls · Tokens.
3. Bento of cards in three full rows, broad to narrow: spend by source (donut, two columns) · projects / flows · agents · users / providers & keys · models, half the width each. What kind of work spends, then which team, then which flow, agent or person, then which key or model pays. Card rows stay quiet: name and parent on the left, the amount on the right, a thin share bar underneath. The share % is only in the bar's hover tooltip. A bar-behind-the-row layout was tried and dropped on 2026-10-20. Change % lives on the hero, the see-all list and the detail page, not on card rows. There is no "biggest changes" card.
4. The cost footnote.

## Key files
- `packages/web/src/app/routes/platform/setup/ai/usage-tab` — page, cards, and the dummy-data module (`usageDummyData`) until the read API lands. While it is a prototype, `?preset=loading|error|empty|minimal|half|short-history|rich|super-rich` (or the bottom-right Preview button) shows each data state
