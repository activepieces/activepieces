---
icon: 🧭
---

# Admin pages

Every Platform Admin page is assembled from one of five templates. A page leaves its template only where its
job needs a different shape, and that exception is listed here with its reason.

## Structure

Every admin screen is one of five things. Pick by the job, not by how much there is to show.

- **Page** — one thing an admin comes to manage or check on its own. Sidebar item, URL, title, one sentence.
- **Group** — two or more pages that look at the same subject from different sides (Health › Overview,
  Runs, Queue, Triggers). The group is a sidebar label that opens and closes; it never navigates and never
  repeats a child's name. If the pages are different subjects that only share a category, they stay
  separate items; if one is a setting of the other, it is a panel.
- **Panel** — settings changed in the same visit, as a titled block on a page.
- **Sheet** — one record from a list, opened over it (a connection, a user, an audit event).
- **Detail page** — a record with parts of its own that people link to (a role, a piece policy, an AI key).
  It has a back link and no sidebar item.

A page's title is its item, joined to the group when the item alone is vague: Pieces › Policies is titled
"Piece policies", Health › Runs is "Run health", People › Users stays "Users". Titles and descriptions live
in one place, `AdminPageHeader` (`admin-page-header.tsx`); the browser title in `platform-routes.tsx` uses
the same words. Moving a page means adding its old URL to `legacy-path-redirect.tsx`.

The current group opens on its own and the rest close as you navigate. On the collapsed rail a group opens a
menu of its pages. Filters live in the URL and are replaced, not pushed: Back leaves the page rather than
undoing a filter. Opening a sidebar item starts a fresh view; only `keepSearch` keys (Health `month`) carry
across.

| Category | Items (groups in brackets) |
|---|---|
| Organization | Projects · People (Users, Roles) |
| Building | Pieces (Catalog, Policies, Add step menu) · Templates · Connections · AI providers |
| Security | Single sign-on · Secret managers · API keys · Audit log (Events, Streaming) |
| Integrations | Embed SDK · MCP server (Tools, Activity) |
| Operations | Workers (Machines, Groups) · Health (Overview, Runs, Queue, Triggers) |
| Settings | General · Billing (Plan, Usage) |

## Words

Sentence case. Titles are nouns people already say; a description says what you do on the page in one
sentence, with no product name (the admin is white-labelled). Buttons are a verb and the thing ("New policy",
"Invite people"). A confirmation names the thing and the consequence. One word per concept:

| Say | Not |
|---|---|
| piece | integration, app |
| project (team or personal) | workspace |
| user (has an account) / member (is in a project) | either one for the other |
| global connection | platform connection, shared connection |
| piece policy | piece set, in anything a person reads (the API and SDK keep `pieceSet`) |
| worker machine | worker, for a machine |
| run | execution |

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

- **Piece policy** keeps a pick-list (Allowed / Limited / Blocked) because hundreds of pieces are edited in place.
- **MCP server › Tools** keeps the four tool tiers.
- **Embedding** is a settings page that also holds a short signing-keys table.

## Key files
- `packages/web/src/components/custom/list` — list cells, toolbar, row menu, URL params
- `packages/web/src/components/custom/page.tsx` — `Page`, `PageHeader`, `PageColumns`, `PageLock`
- `packages/web/src/components/custom/panel.tsx`, `settings-parts.tsx`, `resource-card.tsx`, `day-bars.tsx`
- `packages/web/src/app/routes/platform-routes.tsx` — admin routes; `routes/platform/legacy-path-redirect.tsx`; `routes/platform/admin-page-header.tsx` — page titles and descriptions
