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
route gets. `PlatformLayout` is 44 lines and mounts the platform sidebar with no rail beside it.

`ap-sidebar-item` and `ap-sidebar-group` are the shared primitives, used by the dashboard and platform
sidebars only. The rail imports neither.

## Gotchas

- **`workspace-shell/` does not exist, and anything still referring to it is stale.** PR #14330 reverted
  the four merges that introduced it (#14298, #14303, #14304, #14306) five days after they landed,
  deleting the folder along with `stage-context.tsx`, `stage-breadcrumb.tsx` and `chat-dock-context.tsx`,
  and restoring `sidebar/dashboard`. That revert was 106 files and touched **zero** platform-admin files,
  so it is not a precedent for admin-nav work; what it does show is why it was unrevertable in pieces,
  since it bundled a navigation model change together with global search and the builder canvas. Keep a
  navigation change scoped to one surface and it stays revertable on its own.
- **The rail and the platform admin nav are aligned by hand, not by shared code.** `primary-rail` imports
  none of the sidebar primitives, so the two columns only look like one system because PR #15028 tuned
  their widths and spacing to match. Any change to admin nav metrics needs re-checking against the rail,
  and no type error or test will tell you it drifted.
- **Platform admin deliberately renders without the rail.** `PlatformLayout` mounts the platform sidebar
  straight under `SidebarProvider`, because the rail beside it meant two left columns and a narrower admin
  nav, and the admin nav already carries its own way back out. This is a documented departure from the
  `design/workspace-redesign` direction, which did show the rail there. Entry in is the rail's platform
  admin button; the way out is the "Back to app" link in the platform sidebar header, which resolves
  through `determineDefaultRoute`.
- **A role check inside a platform admin page is dead code.** `PlatformLayout` calls `useIsPlatformAdmin()`
  and redirects away when it fails, so every component below it already knows the viewer is a platform
  admin. AI Center nonetheless wrapped itself in a guard keyed on `platformRole !== PlatformRole.ADMIN`,
  which can never be true where it sits, and that guard was the only thing standing in for a plan gate on
  that page: reading it, the page looks gated when nothing gates it. Same shape as the `isCommunity` checks
  under `BillingPageShell`. Before adding a guard to an admin page, check whether the layout above already
  decided it.

- **`locked` is a platform-only concept living in a shared primitive.** `ap-sidebar-item` renders the lock
  icon, but the dashboard sidebar passes `locked` zero times and the platform sidebar passes it fifteen.
  So a change to lock or badge rendering edits a file two callers share to alter a path one caller uses.
  Worth rendering platform-specific item chrome in the platform sidebar instead, rather than growing the
  shared primitive for one consumer.
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

## Key files

- `packages/web/src/app/components/primary-rail`: the chat-first rail
- `packages/web/src/app/components/sidebar`: `ap-sidebar-item` / `ap-sidebar-group` primitives, plus the `dashboard`, `platform` and `project` navs
- `packages/web/src/app/components/platform-layout.tsx`: `PlatformLayout`, the admin frame and its admin-role check
- `packages/web/src/lib/route-utils.ts`: `determineDefaultRoute`, where "Back to app" goes
