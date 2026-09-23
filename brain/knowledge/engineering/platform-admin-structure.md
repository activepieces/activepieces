---
icon: 🗂️
---

# Platform Admin Structure

How the platform admin (`/platform/**`) is arranged: what earns a sidebar entry, what lives inside a
page, and what opens on top of one. Every rule here is marked **Applied** (true in the code today) or
**Planned** (agreed, not built yet). The project app and project settings are out of scope for now.

## Levels

Everything in the admin is exactly one of these.

| Level | What it is | Own route | In the sidebar |
| --- | --- | --- | --- |
| **Group** | A labelled run of pages, named for a job an admin comes to do | no | as a label |
| **Page** | A place you come to on purpose | yes | yes |
| **Sub-page** | One of several views of the same subject | yes | under its parent |
| **Detail page** | One object big enough to own lists of its own | yes | no, reached from a row |
| **Section** | A heading partway down a page | no | no |
| **Sheet** | The detail or edit of one row | no | no |
| **Dialog** | Create, confirm or delete | no | no |

A **filter** is not a level: the same list narrowed by scope, status or owner stays one page.

## Deciding where something goes

Ask in order and stop at the first yes.

1. **Would someone come here on purpose, or do other screens link here?** A page. Otherwise it is a
   section of the page they would look for it on.
2. **Is it the same subject asked a different way?** A sub-page of that subject. **Is it operated by
   different people at different times?** A separate page, even if the data is related.
3. **Is it one table or a couple of toggles?** It does not earn a sidebar slot; it becomes a section
   of its nearest neighbour.
4. **Is it the same list with a different scope?** A filter, not a sub-page.
5. **Is it one row's detail?** A sheet, unless it owns lists of its own, is linked from elsewhere, or
   takes several steps. Then it is a detail page.
6. **Is it create, confirm or delete?** A dialog, while it stays short. A dialog that grows into a
   wizard or a long form becomes a sheet or a page. A form launched from a sheet is a step inside
   that sheet, never a dialog on top of it.

Keep what you **change** apart from what you **watch**: a control you can fat-finger does not belong
on a screen people scroll through during an incident.

## Groups — Applied

Six groups, named for the job. The regroup renamed no page; see Naming for the planned renames.

| Group | Pages (sub-pages in brackets) |
| --- | --- |
| **Platform** | Projects · Users (Members, Project Roles) · Connections (All, Global Connections) |
| **Catalogue** | Pieces (Pieces, Piece Sets) · Templates · AI Center (Providers, Capabilities) |
| **Security** | Single Sign On · Secret Managers · Audit Logs (Events, Event Streaming) |
| **Developers** | API Keys · Embedding · MCP Server (Connection, Tools, Activity) |
| **Operations** | Workers (Health, Worker groups) · Health (System Health, Runs Health, Queue Health) · Triggers |
| **Account** | General · Billing & subscription · Usage · Configurations (not on Cloud) |

## Sidebar behaviour — Applied

- **Sub-pages unfold only while you are inside their parent**, so the rail stays short. Two levels at
  most: a sub-page never has children.
- **The first sub-page shares its parent's path** and carries `end: true`, otherwise it stays lit on
  every sibling.
- **A crown in the sidebar means the page itself is locked**, not that something on it is paid. A page
  that works with only some actions gated (Projects' New Project, the Pieces list's visibility changes)
  gets no crown; the gated action carries its own. A page is locked when it cannot be used on the plan:
  it shows the sample overlay, or its data is behind the plan (Piece Sets).
- **A parent wears the crown only when every sub-page under it is locked**, and it is dimmed exactly when
  it is crowned. Otherwise the crown sits on the locked sub-pages. A locked parent locks all its children.
- **Detail pages have no sidebar entry.** You always arrive from a row. Planned: the back link always
  goes somewhere concrete, never browser history.

## URLs — Applied

- **Flat, and the group is never in the URL.** `/platform/sso`, not `/platform/security/sso`. Moving a
  page to another group is a sidebar edit and nothing else.
- **The slug matches the page's name** (`/platform/embedding`, not `/embed`), singular for a log
  (`/platform/audit-log`). A sub-page nests under its parent (`/platform/users/roles`,
  `/platform/audit-log/streaming`).
- **An old URL keeps working.** `LegacyPathRedirect` maps every page that shipped under
  `/platform/setup/*`, `/platform/security/*` and `/platform/infrastructure/*` to its new home, keeping the
  rest of the path, the query and the hash; an unknown path under one of those folders lands on the
  page that folder used to open. Billing's Stripe return URL relies on the query surviving. `LegacyTabRedirect`
  turns a released `?tab=` link into the matching sub-page. Of the `?tab=` URLs #15563 used for one day
  before release, only the AI and Pieces ones map; the rest open the parent page.
- **A section carries only the query its pages share.** Moving between sub-pages keeps `?month=` (the
  Health pages) and drops everything else, because sibling tables read the same `status`, `cursor` and
  `limit` keys. A new shared key goes in `SECTION_SEARCH_KEYS` in `ap-sidebar-item`.

## Thin pages — Planned

Rule 3 is agreed; the merges are deferred to keep #15727 small. Candidates, each still to confirm:

- **Triggers** (one read-only table) → a section of Health.
- **Queue Health** (two cards and a table) → a section of Health › Runs.
- **Configurations** (two telemetry toggles) → a section of General.
- **MCP Server › Connection** (a URL and a collapsible) → the top of MCP Server, no sub-page.
- **API Keys** (create and revoke) → check against rule 1 before merging; admins do come here on purpose.

## Overlays — Planned

Rules 5 and 6 are agreed. What breaks them today:

- **AI key detail** renders as a page through `?config=` with no route → `/platform/ai/keys/:id`.
- **Project Role editor** is a dialog with thirteen permission rows → a detail page.
- **SAML setup** is a 612-line two-step wizard inside a dialog → a sheet with steps, or a page.
- **Customize Selector** is a 601-line sheet that configures the builder → its own sub-page of Pieces.
- **Nested dialogs** (the SAML domain confirm inside the SAML dialog, the deactivate-users dialog
  chained from cancel-subscription) → steps inside their parent.

## Naming — Planned

**Labels name the job, not the technology.** The rule is agreed; no label changes yet.

- Single Sign On → Sign-in. Event Streaming → Forwarding.
- Triggers is called three things (sidebar "Triggers", tab "Trigger Health", header "Trigger Health
  Status"); pick one.
- "Allowed domains" means embed origins on Embedding and sign-in email domains on SSO; rename one.

## Locked features — Planned

Five treatments exist today (sample overlay, banner with disabled actions, silent redirect, silent
hiding, and the full-page teaser). Proposed, not yet agreed: a whole locked page uses the sample overlay
(`PlanFeatureSample`); a single locked control on an otherwise usable page carries a crown and asks for
the upgrade on click, as the sidebar rule above already assumes; nothing is hidden or redirected
silently. Worker groups is the last page on the old full-page teaser.

## Known overlaps — Planned

- **Connections appear in three places**: the all-connections list, Global Connections, and the
  Projects page's global-connections column and edit field. Global is a scope, so it should end up
  a filter on one list (rule 4).
- **Worker CPU and RAM** show on both Workers › Health and Health › System.
- **Billing and Usage** read the same subscription and credits; Billing's Credits section overlaps
  Usage's meters.
- **Project assignment** is done from four places: Edit Project, Edit Global Connection, a piece set's
  Assigned projects, and an AI key's Project access.
- **The DNS-verify block** is duplicated between Embedding and the SAML dialog.
- **One header per page**: pages use four header styles today (`DashboardPageHeader`, `CenteredPage`,
  and two hand-rolled `h1`s). Pick one and the two page widths (full for lists, narrow for forms).

## Gotchas

- **Adding an admin page is three edits**: the sidebar (`components/sidebar/platform`), the route
  (`platform-routes.tsx`), and global search (`components/global-search/static-pages.ts`). Nothing
  checks the three agree. A page whose locked state is the sample overlay also needs a
  `PlanFeatureSample` entry, or it opens unlocked.
- **Moving or renaming a route needs a `LEGACY_PATHS` row**, or every bookmark, doc link and in-flight
  Stripe checkout to the old URL lands on a 404.
- **Source folders still follow the old grouping** (`routes/platform/security/embed`,
  `routes/platform/infra/...`). The URL is the contract; the folder is not, so do not read a page's
  group from its path.

## Key files

- `packages/web/src/app/components/sidebar/platform` — the groups and pages, `PlatformSidebar`
- `packages/web/src/app/routes` — every admin route, in `platformRoutes`
- `packages/web/src/app/routes/platform` — the pages, `LegacyPathRedirect`, `LegacyTabRedirect`,
  `PlanFeatureSample`
- `packages/web/src/app/components/sidebar` — `ApSidebarItem`, which does sub-item unfolding and the crown rule
