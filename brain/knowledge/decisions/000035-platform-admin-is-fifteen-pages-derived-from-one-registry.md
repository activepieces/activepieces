---
status: accepted
---

# Platform admin is fifteen pages derived from one registry

## Decision

The platform admin nav collapses from **22 items in 5 labelled groups to 15 items in 3 unlabelled blocks**,
and every page, route and gate derives from **one declarative registry** rather than the three unconnected
places that held them. Six of the fifteen pages have sections: Users & access, Connections, Security,
AI Center & MCP, Pieces, and Billing & usage.

**A section parent is a page, not an alias for its first child.** Each of the six parents — Users & access,
Connections, AI Center & MCP, Security, Billing & usage, Infrastructure — owns an overview at its bare
path: a card per child carrying that child's live count and plan tier, then the few sections that only make
sense across the whole section (sign-in policy, connection health, AI credits, a security checklist,
infrastructure status). Children therefore all address an explicit `?tab=`, where the first one used to sit
on the bare path. The overview is what makes a parent worth clicking; without it the parent row was a lie,
navigating somewhere its label did not name. This also retires the rule below that a page with its own tabs
never becomes a tab: `Workers`, `Health`, `Triggers` and `Configurations` are now tabs of `Infrastructure`,
which is what let the group labels come back over a nav short enough to read.

**Those sections live in the sidebar, not in the page.** Each one is an indented sub-item under its parent,
with a connector line, so the nav is fifteen parents and fourteen children. An in-page tab row was built
first and rejected: it left the sidebar reading as fifteen flat items with nothing under them, while the
structure that mattered was hidden inside whichever page you had opened. Sub-items address the same
`?tab=` the tabs used, so the first section stays on the bare path and every redirect kept working.

One rule decided most of the shape: **a page that already has its own tabs does not become a tab**. That
keeps `Pieces` (two tabs plus a child route), `Workers` and `Health` as their own items, so Infrastructure
stays four separate items rather than becoming one page. `Templates`, `Branding` and `Embedding` also stay
separate, so the embed wizard keeps a page of its own. `MCP Server` is the deliberate exception: it folds
into `AI Center & MCP` as a third tab, because its own two tabs are a light pill control that reads as a
different level rather than a second tab row.

The old `General` page is renamed **Platform Settings** and holds what is not branding: the platform name,
the auto-create-personal-projects default, and the Cloud owner's danger zone. The five plan-gated branding
assets move to `Branding`. The platform name stays behind because it is ungated on every edition, which is
what makes each of the two pages wholly gated or not gated at all.

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

**A feature you cannot act on shows itself filled with sample data, behind a floating upgrade card.**
`Audit logs` is a table, so there is no action to crown, and opening it freely would show an empty table
with nothing to explain why. The page renders its real header, filters and rows populated with believable
sample data, drops to a quarter opacity, and an elevated card sits centred over it carrying the lock, the
feature's name, its description, a full-width CTA and the plan line. It borrows the shape of the sign-in
screen, and unlike a fade it keeps the whole page visible rather than only its top third.

**The presentation was iterated six times, and the rejected five are the useful record**, because each
failed for a reason worth not rediscovering. **Blur** hides the very rows the treatment exists to show. A
**strip** above the content said the right words but left the page reading as ordinary. A **framed
container** read as locked but dominated the page it was previewing. **Chrome merged into the page's own
header** was too quiet, and needed a React context plus edits to both shared headers and `DataTable` to
deliver. A **full-bleed banner** announced the paywall before the page had shown anything. A **gradient
fade** read as one surface but revealed only the top of a page and cut a form mid-field. A Mobbin survey
found products split between crisp-and-labelled and fade-an-empty-shell, and none sampling a form, so
there is no direct precedent to defer to here.

The sample content is **inert and visibly so**: the region takes `pointer-events: none`, filters and
pagination render disabled, and the only live control is the banner's CTA. The alternative, making the
controls work against the fixtures, means a second implementation of every filter that exists only for
customers who have not paid.

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

**Splitting Branding out costs two crowns on Community.** Keeping the ungated platform name in the same
page as the gated assets would have left that page unmarked; separating them makes `Branding` wholly gated,
and `Embedding` too now that it is not sharing a page. Five markers on Community rather than three. Taken
anyway, because the alternative is the per-field `brandingLocked` split the brain already records as a
gotcha, where five inputs grey out with no explanation beside a sixth that works.

**A tab promoted to a section inherits nothing from its old page wrapper.** The AI Center page supplied
`max-w-6xl px-8 py-6` and the scroll container for its tabs, so `providers-tab` and `capabilities-tab`
carried no padding of their own; once the route rendered them directly they sat flush against the edge.
Each section now supplies its own padding, and the layout's `#dashboard-content-container` already
scrolls, so none of them needs `overflow-auto`. Check the old wrapper before promoting the next tab.

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

**Splitting one form in two.** `appearance-section.tsx` is a single react-hook-form whose submit handler
deliberately skips the branding fields when locked. Platform Settings and Branding each need their own form.

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
real. No product in the survey samples a *form*, so our Single sign on, Branding and Embedding treatment
has no precedent to lean on, which is worth remembering given it is the same part that costs two working
controls.
