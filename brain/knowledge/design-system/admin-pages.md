---
icon: 🧭
---

# Admin pages

Every Platform Admin page is assembled from one of five templates. A page leaves its template only where its
job needs a different shape, and that exception is listed here with its reason.

## Structure

The admin sidebar is flat: one entry per page. Views of the same thing are tabs on that page (`PageTabs`),
never nested sidebar items. The sidebar label, the `PageHeader` title and the browser title are the same
words, in sentence case. Moving a page means adding its old URL to `legacy-path-redirect.tsx`.

| Group | Pages (tabs) |
|---|---|
| Platform | Projects · Users (Users, Roles) · Connections |
| Catalogue | Pieces (Pieces, Piece sets) · Templates · AI |
| Security | Single sign-on · Secret managers · Audit log (Events, Streaming) |
| Developers | API keys · Embedding · MCP server (Tools, Activity) |
| Operations | Workers (Machines, Groups) · Health (System, Runs, Queue, Triggers) |
| Account | General · Billing (Plan, Usage) |

## Rules

- **Header** — title, one sentence on what the page is for, one primary action top right (`Button` with
  `Plus`). Secondary actions go in a "…" menu next to it.
- **Finding** — search first (`ListSearch`, kept in the URL, server-side when the API supports it), then
  count tabs (`CountTabs`), then filter chips (`DataTableFilter`). A toolbar never holds buttons.
- **Rows** — clicking a row opens the record (sheet, dialog or detail route) and never leaves the admin.
  All row actions live in one `RowMenu`; destructive items go last and red.
- **Status** — `StatusDot` with a word. Tones: `success` working, `warning` needs attention or pending,
  `danger` failed, `accent` in progress, `neutral` off.
- **Dates** — `DateCell`: relative for activity ("2 hours ago"), `mode="short"` for creation ("14 Mar"),
  the full date on hover. Missing values are "—", missing timestamps "Never".
- **States** — every list has a "nothing yet" empty state with the primary action, a "nothing matches"
  state, a loading state and an in-place error state.
- **Plan gates** — a locked page uses `PlanFeatureSample` (header, plan card, faded preview). A locked
  control shows `PlanBadge` and is disabled with a tooltip. No banners.
- **Confirming** — deleting something others depend on uses `ConfirmDialog` with `typeToConfirm`.

## Templates

**List** — records that grow and need scanning. `Page` › `PageHeader` › `ListToolbar` › `DataTable` with
cells from `components/custom/list/list-cells.tsx` (`NameCell`, `PersonCell`, `NumberCell`, `DateCell`,
`TagsCell`, `MutedCell`) and `RowMenu`.

**Settings** — configuring one thing. `Page width="narrow"` › titled `Panel`s of `SettingRow`s: label and help
left, control right. Switches and chips save on the spot; typed fields save through `SaveBar` in the page
footer, shown only when dirty. `DangerZone` is always the last panel. `ChipListField` for lists of domains,
`CopyField` for values to copy.

**Detail** — one record with sub-parts, on its own route. `PageHeader` with `back`, a meta line as the
description and header actions, then `PageColumns` (main work left, small panels right).

**Monitor** — watching. The period picker sits in the header actions; then `StatRow`, one chart, and the
table that explains it. Day-by-day health uses `DayBars`.

**Cards** — a few things that each carry their own health or setup (vaults, worker machines, AI keys).
`ResourceGrid` of `ResourceCard`s. Use a List instead once there are usually more than about ten.

## Exceptions

- **Piece set** keeps a pick-list (Allowed / Limited / Blocked) because hundreds of pieces are edited in place.
- **MCP server › Tools** keeps the four tool tiers.
- **Embedding** is a settings page that also holds a short signing-keys table.

## Key files
- `packages/web/src/components/custom/list` — list cells, toolbar, row menu, URL params
- `packages/web/src/components/custom/page.tsx` — `Page`, `PageHeader`, `PageColumns`, `PageLock`
- `packages/web/src/components/custom/panel.tsx`, `settings-parts.tsx`, `resource-card.tsx`, `day-bars.tsx`
- `packages/web/src/app/routes/platform-routes.tsx` — admin routes; `routes/platform/legacy-path-redirect.tsx`
