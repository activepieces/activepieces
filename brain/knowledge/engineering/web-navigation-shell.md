---
icon: 🧱
---

# Web Navigation Shell

The frame the web app renders every route inside. Four components, and knowing which is shared matters
more than knowing what each looks like.

**Primary rail** (`components/primary-rail`) is the chat-first left rail that replaced the project
sidebar in PR #15005. Chat, Agents, Explore, Impact, plus the projects list and the credits meter.

**Dashboard sidebar** (`components/sidebar/dashboard`) is the older per-project nav the rail replaced
on most surfaces.

**Platform sidebar** (`components/sidebar/platform`) is the platform-admin nav, and it is the only one
of the three that understands paid gating. Its groups and items are a literal built inline on every
render, not a config.

**Layouts** (`components/platform-layout.tsx`, `components/project-layout`) pick which of the above a
route gets. `PlatformLayout` mounts the platform sidebar with no rail beside it.

`ap-sidebar-item` is the item primitive, and only the platform sidebar uses it. The rail does not.

## Gotchas

- **`workspace-shell/` does not exist, and anything still referring to it is stale.** PR #14330 reverted
  the four merges that introduced it (#14298, #14303, #14304, #14306) five days after they landed,
  deleting the folder along with `stage-context.tsx`, `stage-breadcrumb.tsx` and `chat-dock-context.tsx`,
  and restoring `sidebar/dashboard`. That revert was 106 files and touched **zero** platform-admin files,
  so it is not a precedent for admin-nav work; what it does show is why it was unrevertable in pieces,
  since it bundled a navigation model change together with global search and the builder canvas. Keep a
  navigation change scoped to one surface and it stays revertable on its own.
- **The rail and the platform admin nav are aligned by hand, not by shared code.** `primary-rail` imports
  none of the sidebar item components (only `CreateProjectButton` borrows `SidebarMenuButton`), so the
  two columns only look like one system because PR #15028 tuned their widths and spacing to match. Any
  change to admin nav metrics needs re-checking against the rail, and no type error or test will tell you
  it drifted.
- **Platform admin deliberately renders without the rail.** `PlatformLayout` mounts the platform sidebar
  straight under `SidebarProvider`, because the rail beside it meant two left columns and a narrower admin
  nav, and the admin nav already carries its own way back out. This is a documented departure from the
  `design/workspace-redesign` direction, which did show the rail there. Entry in is the rail's platform
  admin button; the way out is the "Back to app" link in the platform sidebar header, which resolves
  through `determineDefaultRoute`.
- **A role check inside a platform admin page is dead code.** `PlatformLayout` calls `useIsPlatformAdmin()`
  and redirects away when it fails, so every component below it already knows the viewer is a platform
  admin. AI Center used to wrap itself in a guard keyed on `platformRole !== PlatformRole.ADMIN`,
  which can never be true where it sits, and that guard was the only thing standing in for a plan gate on
  that page: reading it, the page looks gated when nothing gates it. Same shape as the `isCommunity` checks
  under `BillingPageShell`. Before adding a guard to an admin page, check whether the layout above already
  decided it.

- **The crown on a nav item is a label, not a gate.** `ap-sidebar-item` draws it when `locked`, but the
  click still navigates, so what the user meets is whatever the destination page does: a
  `PlanFeatureSample` overlay, a banner with disabled actions, or nothing. Reading the sidebar tells you a
  feature is paid, not how its page behaves.
- **`/platform` redirects without `replace`, so Back lands you right back on it.** Every other admin
  redirect passes `replace` to `<Navigate>`, but the one on `/platform` in `platform-routes.tsx` does not,
  so the browser Back button re-enters the redirect instead of leaving the admin. A one-word fix.

- **Admin sections are routes, not tabs.** Pieces, Workers, Health, AI Center and MCP Server used to switch
  sections with in-page tabs; each section is now a sidebar sub-item with its own path, and
  `LegacyTabRedirect` rewrites an old `?tab=` link to that path (MCP's tabs never had one). A new section gets a route and a
  sub-item, plus an entry in the page's `*_TAB_PATHS` map if it replaces a tab.

- **The active item is a `matchPath` on the pathname, so query strings never count.** A parent row is
  active for any path under it; a sub-item that shares its parent's path needs `end: true`, or it stays lit
  on every sibling. See `isRouteActive` in `ap-sidebar-item`.

- **Tailwind v4's `data-*:` variant matches the attribute's *presence*, so a component that always renders `data-active={bool}` styles every instance as active.** React writes `data-active="false"` for a false value rather than omitting the attribute, and `data-active:bg-sidebar-accent` compiles to `[data-active]` — so `SidebarMenuSubButton`, which defaults `isActive = false` and always spreads it, painted the accent background on *every* child row at once, leaving the URL as the only signal of which one you were on. Write `data-[active=true]:` whenever the attribute is always present. The same shape sits in `sidebarMenuButtonVariants`, where it is *not* harmless: `data-active:text-sidebar-accent-foreground` paints every row at the accent foreground, so a plain `text-*` class on a row — a muted treatment for a plan-locked entry, say — loses to it (0,2,0 beats 0,1,0) and silently does nothing. Fix the variant rather than reaching for `!` on the row: an `!important` colour also beats the base's `hover:text-sidebar-accent-foreground`, so the row silently stops responding to hover. Related: that cva has no active *background* at all, so a row cannot be highlighted through `isActive` alone — the platform rail sets the background with `cn()` and an explicit `hover:bg-sidebar-accent!`, because the base's `hover:bg-sidebar-accent` is (0,2,0) and a plain `bg-*` is (0,1,0); tailwind-merge does not collapse them, since the modifiers differ.
- **The animated icons in `components/icons/*` wrap their `<svg>` in a plain `<div>`, so a size class on the icon sizes the wrapper and not the drawing.** The wrapper takes `className`; the svg inside carries `width`/`height` from a `size` prop (28 in 32 of the 38, 16 in five, 20 in `zap.tsx` alone) and is then overridden by whatever `[&_svg]:size-*` the parent sets — a descendant selector, which outranks any plain class on the svg. A rail asking for 20px icons therefore rendered 16px ones until the *parent* said `[&_svg]:size-5` — which wins not on specificity (it is the identical selector to the base) but because `SidebarMenuButton` composes through `cn()` and tailwind-merge drops the base for the same key. On a component that does not run its classes through `cn()`, the two rules tie and the generated stylesheet's own ordering decides — not the order you write them in the class attribute. Worse, the svg is `display: inline`, so inside that wrapper it sits on the text baseline rather than centred: two pixels high, while any bare svg beside it (`McpSvg`, the user avatar) centres correctly — which reads as a rail where the icons are subtly, inconsistently off. `[&_svg]:block` removes the baseline gap for both shapes. Measure rather than eyeball: compare each icon's `getBoundingClientRect()` centre against its row's.
- **`SidebarContent` is already a scroll container, so wrapping it in another one gives you two scrollers.** It ships `overflow-auto`, and used to carry a `no-scrollbar` class that was defined nowhere (`styles.css` defines `scrollbar-none`); the dead class has since been removed. Note that the global "6px pill" in `styles.css` is not what Chrome draws: the same block sets the standard `scrollbar-width: thin` on `*`, and from Chrome 121 a standard `scrollbar-width` makes the browser ignore every `::-webkit-scrollbar` rule, so what renders is a ~10px track that takes layout width whenever the box overflows and shows arrow buttons at both ends once `*:hover` colours it. That track is why a scrolling list's right padding reads wider than its left. Reach for `ScrollArea` wherever a thin bar matters; its `type` decides whether it shows always or on hover. The platform rail had a hand-rolled `flex-1 overflow-y-auto` around it: two nested scrollers, wheel events chaining between them, and the visible thumb belonging to the outer box. Have exactly one scroller. The platform rail makes `SidebarContent` `overflow-hidden` and scrolls through `ScrollArea` instead, whose Radix scrollbar is an overlay: it takes no layout width and has no arrow buttons, so it can sit in the rail's right padding without unbalancing it. To say there is more below, pass `showGradient` to `ScrollArea`: it veils the bottom of the list into the sidebar colour only while the viewport can still scroll down, and `gradientClassName` sets its height (the default fifth of the viewport is far too tall for a nav rail).
- **A sidebar painted the same colour as the page is judged against the content card, not its own edge.** `bg-sidebar` is also the background behind the dashboard card, so the rail's right edge is invisible and the eye measures a row's right padding to the card's border. `ProjectDashboardLayout` puts the card flush against the rail (`pr-2 pt-3 pb-3`); a layout that pads the card on the left too (`p-2`) adds that padding to the rail's apparent right gutter, and the rail reads as lopsided however symmetric its own insets measure.

## Key files

- `packages/web/src/app/components/primary-rail`: the chat-first rail
- `packages/web/src/app/components/sidebar`: the `ap-sidebar-item` primitive, plus the `dashboard` and `platform` navs
- `packages/web/src/app/components/platform-layout.tsx`: `PlatformLayout`, the admin frame and its admin-role check
- `packages/web/src/lib/route-utils.ts`: `determineDefaultRoute`, where "Back to app" goes
