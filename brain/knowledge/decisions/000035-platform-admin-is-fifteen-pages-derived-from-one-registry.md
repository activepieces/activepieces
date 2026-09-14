---
status: accepted
---

# Platform admin is fifteen pages derived from one registry

## Decision

The platform admin nav collapses from **22 items in 5 labelled groups to 15 items in 3 unlabelled blocks**,
and every page, route and gate derives from **one declarative registry** rather than the three unconnected
places that held them. Six of the fifteen pages have sections: Users & access, Connections, Security,
AI Center & MCP, Pieces, and Billing & usage.

**A section parent is a page, not an alias for its first child.** Users & access, Connections, AI Center &
MCP, Security, Billing & usage and Infrastructure each own an overview at their bare path: a card per child
carrying that child's live count and plan tier, then the few sections that only make sense across the whole
section (sign-in policy, connection health, AI credits, a security checklist, infrastructure status).
Children therefore all address an explicit `?tab=`, where the first one used to sit on the bare path. The
overview is what makes a parent worth clicking; without it the parent row was a lie, navigating somewhere
its label did not name. This also retires the rule below that a page with its own tabs never becomes a tab:
`Workers`, `Health`, `Triggers` and `Configurations` are now tabs of `Infrastructure`, which is what let the
group labels come back over a nav short enough to read.

**`Pieces` takes the other way out: the parent row IS the first tab.** It has tabs and no overview, and
rather than invent a landing page over two children, its `pieces` tab carries `hideInNav: true`. The tab
stays routable and still owns the bare path, but the sidebar does not draw it as a sub-item, so the nav
reads `Pieces` with one child `Piece Sets`, and clicking the parent opens the pieces table. This satisfies
the rule above rather than breaking it: the parent row goes where its label says. Reach for it whenever a
section's first tab is the obvious thing the parent name already promises, and reach for an overview when
the parent name covers several children equally.

**Those sections live in the sidebar, not in the page.** Each one is an indented sub-item under its parent,
with a connector line. The counts in this decision's title and first paragraphs were the plan; the registry
is the truth and has moved since, currently eleven nav parents and twenty children. An in-page tab row was built
first and rejected: it left the sidebar reading as fifteen flat items with nothing under them, while the
structure that mattered was hidden inside whichever page you had opened. Sub-items address the same
`?tab=` the tabs used, so the first section stays on the bare path and every redirect kept working.

**A page that already has its own tabs does not become a tab** was the rule that decided most of the
shape, and it is now fully retired. It went first for Infrastructure, which absorbed `Workers`, `Health`,
`Triggers` and `Configurations`, and then for `Pieces`, whose own two tabs became the registry tabs
`Pieces` and `Piece Sets` while its `:id` child route stayed where it was. What survives of the rule is
its opposite: an in-page tab row is a **candidate** for promotion, because the sidebar is where sections
belong. `Templates` and `Embedding` stay separate for their own reasons, so the embed wizard keeps a page
of its own. `MCP Server` folds into `AI Center & MCP` as a third tab, because its own two tabs are a light
pill control that reads as a different level rather than a second tab row.

**Promoting an in-page tab row costs no URL change**, which is what makes it cheap. Both conventions are
the same one: first tab on the bare path, the rest on `?tab=<id>`. `Pieces` was already hand-rolling
exactly that, deleting a `useSearchParams` handler and a `TabsList` per page promoted.

**Ask the registry which tab is active; never recompute it in the sidebar.** `adminPagesUtils.activeTabId`
resolves the `?tab=` param, or `null` when the page has an overview, or the first tab otherwise, and the
nav highlights the parent whenever no visible sub-item owns that answer. That one rule replaced three
hand-written special cases (`tabs.length === 0`, `hasOverview && tab === null`, `index === 0`), which had
all silently assumed every routable tab was also a visible sub-item. `hideInNav` broke that assumption, and
anything else that makes the routable set differ from the nav set will break it again.

**Sample mode mounts the real page, so its plan-gated queries must be `enabled`-guarded.** `FeatureSample` renders the
locked page ghosted underneath the upgrade card, which means every `useQuery` inside it fires for platforms that lack
the feature; an endpoint behind `platformMustHaveFeatureEnabled` then answers 402 on every visit (seen 2026-09-14 on
`/platform/security/embed`: `GET /v1/signing-keys` → 402 until `useSigningKeys` got `enabled: platform.plan.embeddingEnabled`).
`LockedFeatureGuard` used to hide this by not mounting the page at all. A 31-page smoke run also surfaced three
pre-existing console warnings the ghosted rows now expose on every plan: a bare `<TooltipTrigger>` around a `<Checkbox>`
(nested buttons, on projects / templates / project roles), `<DialogTrigger asChild>` wrapping a `<>` fragment in
`edit-global-connection-dialog.tsx` ("Invalid prop `type` supplied to React.Fragment"), and DataTable filters whose
`accessorKey` names no column (`pieceName`/`projectIds`/`ownerIds` on connections, `name` on pieces). None are regressions.
The populated states were verified separately against a 0.90.4 EE backend with seeded data (two pending platform
invitations, six connections with one in `ERROR`): "Pending invitations" lists the emails, "Needs attention" lists the
failing connection, "Most used pieces" ranks by count. One nit surfaced there: both connection overview sections label rows
with the raw package name (`@activepieces/piece-apollo`) instead of the piece display name. Seeding notes: the invitation
endpoint enforces the seat quota (402 `QUOTA_EXCEEDED`) so `platform_plan.usersLimit` has to be lifted first; a personal
project refuses project invitations ("Project must be a team project"); connections cannot be inserted by hand because the
list endpoint decrypts every `value` (`ERR_CRYPTO_INVALID_IV` → 500), and a dev backend with `AP_PIECES_SOURCE` on files
returns `piece_metadata_not_found` for anything not in `AP_DEV_PIECES`, so seed through `POST /v1/app-connections` with
`type: NO_AUTH` (skips engine validation) against a backend that knows the piece.

**An overview is gated like any other page, an unknown tab redirects, and a failed query says so.** The overview
branch of the route resolver wraps in the same `FeatureSample` as component pages, so a locked section (Billing on
Community, declared with `sample: true` and a teaser in the registry) shows the upgrade card instead of empty values.
A `?tab=` that is hidden or unknown redirects to the page's bare path rather than silently rendering the first tab,
and overview cards derive their tab links from `visibleTabs`, never a hardcoded list. `OverviewCard` and
`OverviewSection` take `isError`/`error` and `isLoading`: a failed fetch renders `DataFetchErrorState`, a pending one a
skeleton, and only real data can claim "healthy" or "none". The connections overview counts project-scoped
connections only, so global ones are not counted twice, while "Needs attention" still lists failing global ones.
Greptile caught all four on the first review of #15526 (2026-09-14).

**Groups never collapse.** Every page with sub-items draws them all the time; there is no chevron and no
collapse state. A per-page `collapsed` boolean was tried first and left `/platform/users?tab=members` with
nothing lit up whenever the group had been closed earlier; a per-navigation version fixed that but bought
little for its state, so it was dropped for always-expanded on 2026-09-13.

**`General` keeps its name and keeps branding inside it.** It holds the platform name, the five plan-gated
branding assets, the auto-create-personal-projects default, and the Cloud owner's danger zone, as one form
with one Save. A `Branding` page was split out first and has been folded back: the split was there so each
of the two pages was wholly gated or not gated at all, but it cost a second nav item and a second form for
five inputs, and the page it left behind was three fields.

The gated half is marked in place instead, with a `FeatureBanner` above the branding inputs carrying the
upgrade link while the platform name stays editable. That is the same treatment `Pieces` already uses for a
partly gated page. `General` therefore wears no crown and is the one admin page where part of the body is
gated and part is not.

**A paid feature is gated at the action, not at the door.** The page opens, the data loads, the forms
fill in, and the crown sits on the primary action: on `New Project`, again on `Create Project` inside the
dialog, and only that final click is refused, with an upgrade dialog explaining the feature. An admin
evaluating Activepieces can therefore see what a feature is before being asked to pay for it, which the
earlier full-page teaser made impossible.

**The crown replaces the action's own icon, it does not join it.** A plus and a crown side by side read as
two separate affordances. `useFeatureGate` returns `crown` as an element when locked and `null` when not,
so a plain button is `{gate.crown ?? <Plus className="size-4" />}` and only ever shows one icon. The
exception is `AnimatedIconButton`, whose icon is a prop rather than a child because it animates on hover:
a crown has no animation to drive, so the locked case renders a plain `Button` instead.

**A refused submit swaps its dialog's content, it does not trade one dialog for another.** Closing the form
and opening a second dialog was tried and rejected: each Radix `Dialog` owns an overlay, so the first
animates out while the second animates in, the backdrop undims between them and the screen visibly
flashes. Stacking is worse still, leaving a dead form dimmed behind an upsell of a different width. So the
gate hands over *content* and the host dialog renders it in place of its form, and the overlay element
never unmounts. Two things to get right: reset the swap flag through the same handler that sets `open`,
since a footer button calling `setOpen(false)` skips `onOpenChange` and the next open would show the upsell
instead of the form; and check any two-dialog interaction in the browser, because that is where Radix
orphans `pointer-events: none` on `<body>` and the page behind stops taking clicks.

**A feature you cannot act on renders as the real page, and the gate moves to the write.**
`Audit logs` is a table, so there is no action to crown, and opening it freely would show an empty table
with nothing to explain why. So the page renders at full opacity with nothing over it: real header, real
toolbar, real rows filled with the sample fixtures. Reads all work against those fixtures, meaning search,
filters, sorting, pagination and opening a row for its payload. A write, meaning Save, New, Delete, Export
or a config switch, opens an upgrade popover anchored to the control that was pressed. There is no overlay
and no scrim anywhere in the flow.

Three non-blocking marks say whose data this is: a `Sample data` pill beside the page title carrying the
tier, the table header tinted `#f6f3fe` over the data region only, and a rail pinned to the bottom of the
page holding the one-line pitch and the link out to what the plan adds. On a form page that rail merges
with the form's own action row, so Discard and Save sit inside it.

Designed in Paper, not yet built: the branch still ships the centred sign-in card described below.

**The presentation was iterated seven times, and the rejected six are the useful record**, because each
failed for a reason worth not rediscovering. The seventh, the centred **sign-in card** over a quarter
opacity page, is the one this supersedes: it keeps the whole page visible where a fade shows only its top
third, but it still puts a wall between the person and the thing they came to look at. **Blur** hides the
very rows the treatment exists to show. A **strip** above the content said the right words but left the
page reading as ordinary. A **framed container** read as locked but dominated the page it was previewing. **Chrome merged into the page's own
header** was too quiet, and needed a React context plus edits to both shared headers and `DataTable` to
deliver. A **full-bleed banner** announced the paywall before the page had shown anything. A **gradient
fade** read as one surface but revealed only the top of a page and cut a form mid-field. A Mobbin survey
found products split between crisp-and-labelled and fade-an-empty-shell, and none sampling a form, so
there is no direct precedent to defer to here.

**The sample content is live, not inert.** The earlier call here was the opposite: `pointer-events: none`
on the region, filters and pagination disabled, one live CTA, on the grounds that wiring the controls to
the fixtures means a second implementation of every filter for customers who have not paid. That is
reversed. The fixtures already live in the browser, so client-side filtering and sorting of eight rows is
the cheap half, and a disabled toolbar teaches nobody what the feature does. The cost accepted is that a
locked write control looks completely ordinary until it is pressed: a person will occasionally press Save
expecting it to save. A visibly disabled Save was the alternative and it cannot show what the plan buys.

Sample data is **generated in the browser and never crosses the API**. A locked page skips its plan-gated
query outright rather than letting it answer 402, and the endpoints keep refusing. Serving fabricated rows
from a gated endpoint was rejected outright: an audit trail that returns fiction is a support and
compliance hazard, and every API key and script would see it too.

So the rule is: crown the action where there is one, and fill the surface with sample data where there is
not.

The nav still marks a page when **every** section on it is gated, and marks a gated **section** directly,
so `Security` stays uncrowned while its API keys section works and its three paid sections each carry a
crown.

**The route resolves `?tab=`; every section keeps its own header.** The registry entry names the sections,
the route element picks the active one and renders that component directly, so no page hand-rolls the
searchParams dance again. But the header stays with the page: a unified `AdminPage` shell was built first
and rejected, because it stretched the heading across the full page width instead of the content column,
and it stacked the parent above the section as "AI Center & MCP · Capabilities", which is a breadcrumb the
sidebar already draws. Each page renders the `DashboardPageHeader` or `CenteredPage` header it had before,
and the sections that never had one got the same treatment as their neighbours. The parent name lives only
in the sidebar. `AI Center & MCP` lost the vertical rail it used to ship with, since the sidebar now does
that job for every page. Community sees the same structure as everyone else, but a gated tab there gets a
short "available in Enterprise" note with a docs link rather than benefit bullets and a sales button.

It lands as four PRs: the registry and shell with **no visible change** at all, then the cheap merges,
then gating, then the collapse with its redirects and docs. `/platform` keeps redirecting to Projects: the
section overviews cover the "where am I" job, so a whole-platform landing page is still deferred.

## Context

22 nav items, 18,588 LOC across 103 files, and 13 items wearing a lock icon that is decorative: the click
navigates regardless and the destination page is the real gate. What that page does is inconsistent by
accident, not design. Twelve pages replace their whole body with `LockedFeatureGuard`, Pieces stays usable
under a banner, the branding fields just set `disabled` with no explanation and no upgrade path at all,
and AI Center gates on platform role rather than a plan flag.

The nav is a literal inside `PlatformSidebar`, the routes are a flat hand-written array, and each page's
gate is hardcoded in its own file. Nothing ties the three together, which is why `Embedding` sits under
Setup while routing to `/platform/security/`, and `Event Streaming` sits under Observability while routing
to `/platform/infrastructure/`.

The consolidation itself is not new here. AI Center already folded two nav items into one tabbed page with
a validated `?tab=`, MCP Server was built tab-first, and `setup/general` composes two sections on one page.
Four pages now hand-roll the same searchParams dance, three with an unsafe cast.

## Why

- **Fifteen, not the eleven the mockup drew.** The line counts and the existing tab rows decide it. `usage` is 47 lines and already sits beside billing on
  the same gate and the same endpoint, `mcp` is 117, and sso plus api-keys plus project-roles are 401 and
  already the same `Item` list shape. Against that, Pieces and AI Center are ~3,000 LOC each with their own
  tabs, so folding them in buys a smaller nav by making two real pages harder to use.
- **One registry over three sources.** Adding an admin page becomes one entry instead of three edits, the
  group and URL can no longer disagree, and the nav crown becomes a derived value rather than a maintained
  boolean. The cost accepted is one file that every admin change touches.
- **A shell that owns tabs, not the headers.** Eight pages are about to need the tab dance that four pages
  already copy and three get subtly wrong, so the routing layer absorbs it. Absorbing the headers too was
  the overreach: the twenty-odd pages already agree on two header shapes, and centralising them traded a
  layout every page had right for one the shell got wrong everywhere at once.
- **Three treatments, chosen by what the surface offers.** Once pages carry tabs, a full-page takeover is
  wrong by construction: it blanks a page whose other tabs work. So a page with a primary action gets a
  crown on it, a page you only read gets its own UI blurred, and a page that is partly gated keeps working
  under a `FeatureBanner`. One rule for all three would either hide working controls behind an upsell or
  leave an empty greyed table reading as broken.
- **Crown only when the whole page is gated.** A crown on `Users & access` when only SCIM is paid would be a
  lie, because Members works. Bundling gated tabs beside free ones is what drops thirteen markers to three.
- **Four PRs, each reviewing one idea.** PR #14330 reverted the last big navigation rework, but that revert
  touched **zero** platform-admin files: 106 files across global search, the builder canvas and the dashboard
  sidebar. Its real lesson is that it bundled a navigation model change with unrelated surfaces, so nothing
  could be reverted alone. Scoping this to platform admin and splitting by concern keeps each piece
  revertable. Rendering the platform nav's item chrome locally rather than editing the shared
  `ap-sidebar-item` keeps the shared-file count at zero.
- **A quieter Community.** This is the open-source product, and upsell density there is a brand question and
  not only a conversion one. The structure stays honest, the pitch does not follow self-hosters around.
- **No landing page yet.** It is purely additive, blocks nothing, needs five or six separate queries with no
  aggregate endpoint, and is far easier to design once the twelve-page IA exists.

## Consequences

**An overview's card row fits three, and the fourth wraps.** The cards sit in a
`repeat(auto-fit, minmax(15rem, 1fr))` grid inside a column capped at 1024px, so three tracks plus gaps
are all that fit and Security and Infrastructure render three cards plus an orphan. Narrowing the track
until four fit truncates the longer titles (`Secret mana...`, `Event strea...`), which is worse than the
wrap, so the wrap stands. Treat four as the point where a section has outgrown a single card row rather
than something to squeeze. Use `auto-fit`, never `auto-fill`: `auto-fill` keeps the empty tracks alive, so
a two-card overview renders both at a fifth of the width with dead space beside them.

**A gated query with no `enabled:` puts an error state behind the blur.** The overlay works only because
the query underneath already carries `enabled: platform.plan.<flag>`, the repo rule for any endpoint behind
`platformMustHaveFeatureEnabled`. Without it the request fires, answers 402, and `DataFetchErrorState`
renders "Trouble loading …" under the glass, which reads as broken rather than unpurchased. Check that
guard before giving any surface an overlay.

**PR 0 describes today's 22-item IA on purpose.** The registry and shell ship deriving the nav and routes
that already exist, so the diff is reviewable as pure refactor with identical screenshots, and the
derivation is proven against the IA everyone knows before the data changes under it.

**The quiet Community treatment retires `RequestTrial` from platform admin**, which is currently the only
in-product path from a self-hosted install to sales, feeding `activepieces.com/sales` from 26 feature keys.
That is a growth decision as much as a design one and was taken with that understood.

Old deep links must redirect. 22 items becoming 15 means eleven redirects on top of the five
that exist, and `docs/docs.json` mirrors this IA across about twenty `admin-guide` pages, so a rename lands
in the same PR as the route change.

`SidebarProvider open={true}` means the admin sidebar never collapses, so the collapsed-state branches in
the shared item component stay unreachable from here.

PR #15028 tuned the admin nav's widths and spacing to line up with the primary rail by hand, and the rail
imports none of the sidebar primitives. Any change to admin nav metrics needs re-checking against the rail,
and nothing will fail if it drifts.

**Folding Branding back into `General` reopens the per-field `brandingLocked` gotcha**, where five inputs
grey out beside a sixth that works. The banner above them is what keeps it from being the silent version
the brain records: it names the feature and carries the upgrade link, so the disabled inputs are explained
rather than merely dead. Whether that is enough on Community, which now sees an uncrowned `General` with a
banner inside it instead of a crowned `Branding` item, has not been reviewed yet. Revisit before the gating
PR ships.

Two dead things went with the split: the three file inputs were bound to `logoUrl` / `iconUrl` /
`faviconUrl` form fields whose values nothing ever read, since the inputs are ref-driven and render
`platform.fullLogoUrl` directly, and `sampleData.branding` was their only consumer so it never rendered
either. Both are gone.

**A tab promoted to a section inherits nothing from its old page wrapper.** The AI Center page supplied
`max-w-6xl px-8 py-6` and the scroll container for its tabs, so `providers-tab` and `capabilities-tab`
carried no padding of their own; once the route rendered them directly they sat flush against the edge.
Each section now supplies its own padding, and the layout's `#dashboard-content-container` already
scrolls, so none of them needs `overflow-auto`. Check the old wrapper before promoting the next tab.

The same bite has a second shape: whatever the old wrapper rendered **above** the tab row now renders on
no tab at all. The Pieces page held one `DashboardPageHeader` and one `FeatureBanner` for both tabs, so
promoting them meant giving each tab its own header and extracting the banner into `PiecesLockedBanner`
for both to call. A banner is the easy one to miss, because losing it leaves the locked tab silently empty
rather than visibly broken.

**The third shape is the dangerous one: `?tab=` is a single namespace, and a promoted page that keeps its
own inner tab row in the URL collides with the registry.** `infra/health` reads
`searchParams.get('tab')` for its `system | runs | queue` row and `infra/workers` for its
`health | worker-groups` row. Once Infrastructure became a tabbed registry page the router started writing
`?tab=health`, the page read that same param, matched none of its own panels, and rendered a tab row with
nothing under it. Worse, clicking an inner tab writes `?tab=runs`, which is not an Infrastructure tab id,
so the route's unknown-tab guard redirects to the bare path and ejects you to the overview. Triggers and
Configurations survived only because they have no inner tabs.

Grep the page for `searchParams.get('tab')` before promoting it. **The registry owns `?tab=`; a promoted
page's own row moves to `?view=`**, exported as `VIEW_QUERY_PARAM` from `admin-pages.ts` so the contract
sits beside the thing that claims the other half. Promoting the inner tabs instead was the alternative and
was rejected: it puts six children under one parent, which is what the collapse existed to avoid. Fixed for
Health and Workers on 2026-09-14; old inner-tab deep links like `?tab=runs` now land on the parent overview
rather than a blank page.

Both pages had reached for the param with `searchParams.get('tab') as TabValue`, and that cast is what let
`'health'` through as a legal value of a `system | runs | queue` union. A `parseTabValue` guard that falls
back to the default is what makes an unknown param render the first panel instead of nothing, which is the
difference between a wrong link looking wrong and looking broken. The repo bans `as` casts for exactly this.

**A parent crown is the AND of its tabs**, since `isCrowned` returns true only when every visible tab is
locked. A page whose tabs share one plan flag therefore has to repeat that flag on each tab to keep the
crown it had as a single item: `Pieces` carries `managePiecesEnabled` on both of its.

**Do not give a section a page header when it already opens with a `SectionHeader`.** Providers and
Capabilities each led with one, so adding a header above it printed the title twice.

**Sampling every locked page costs two working controls on Single sign on.** `ssoEnabled` gates only
SAML: `platform.service.ts` checks the plan solely when the payload carries `federatedAuthProviders.saml`,
and `googleAuthEnabled` is enforced with no plan check at all, so the Google and Allowed Email Login
toggles genuinely work on a plan without SSO. Sampling the section wholesale, rather than only its SAML
row, therefore takes two live controls away from EE and Cloud admins who have them today. Taken knowingly,
for one consistent treatment across all nine locked pages. Community is unaffected, because its
sign-in enforcement returns early on that edition anyway.

**Sample data does not mean inventing fixtures for audit events.** `buildMockEvent` in
`@activepieces/shared` already builds realistic `ApplicationEvent` values across forty event names, and the
web app already calls it for the test-destination flow. Reuse it there; only the other locked surfaces need
fixtures written by hand.

**Community keeps its quiet copy inside the loud treatment.** It sees the same sample content, but the
strip names the feature as Enterprise with a docs link in place of the upgrade button, so the open-source
product still avoids a sales button on a dozen pages.

**Nothing renders the full-page teaser once all nine are sampled.** `LockedFeatureGuard` and the page-level
`FeatureTeaser` lose their last callers in platform admin, and `overlay: true` in the registry is replaced
by the sample opt-in. `FeatureTeaserContent` survives inside the upgrade dialog.

**One form, not two.** `appearance-section.tsx` is a single react-hook-form whose submit handler
deliberately skips the branding fields when locked, and both halves post to the same
`platformApi.updateWithFormData`. Splitting it was tried and undone; keeping it whole is what gives the page
one Save.

`Configurations`, added to the nav on 2026-09-07 after the proposal was drawn, becomes Infrastructure's
fourth tab and carries its Cloud exclusion into its registry entry. It already routed under
`/platform/infrastructure/`, so nothing moves. The credits meter the admin sidebar lacks is deferred with
the overview page: additive, and `SidebarUsageLimits` already exists and already returns nothing on
Community.

The four PRs are scoped in `packages/web`, but the largest single chunk is not there. PR 3 carries roughly
fourteen route redirects plus the `admin-guide` restructure in `docs/docs.json`, about twenty pages that
PR #15153 had just expanded.

## Tracking

Grilled 2026-09-07 against the `maybe-chat.activepieces.ai/docs/admin-nav` concept and Langdock's settings
IA as references.

The sample-data treatment was checked against Mobbin afterwards, and the survey supports dropping the
blur: every product found picks one side or the other, never both. Later and Churnkey show crisp,
realistic figures under a labelled band ("just a glimpse", "ANALYTICS PREVIEW"), while Juicebox, Asana
Admin and Hex fade an essentially empty shell behind a card and teach the reader nothing about the
feature. Churnkey's one-word "preview" also reads better than a sentence explaining that the data is not
real. No product in the survey samples a *form*, so our Single sign on, General and Embedding treatment
has no precedent to lean on, which is worth remembering given it is the same part that costs two working
controls.
