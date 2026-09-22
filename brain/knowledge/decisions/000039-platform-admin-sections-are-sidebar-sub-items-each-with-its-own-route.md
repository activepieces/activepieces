---
icon: 🧭
status: accepted
---

# Platform admin sections are sidebar sub-items, each with its own route

## Decision

The platform admin nav is five labelled groups (General, Setup, Security, Observability, Infrastructure)
written inline in `components/sidebar/platform`, and every section of a page is a sidebar sub-item with a
path of its own (`/platform/setup/ai/capabilities`, `/platform/infrastructure/health/runs`), never a
`?tab=`. There is no registry and there are no overview pages. This replaces the registry, overview and
`?tab=` parts of *platform-admin-is-fifteen-pages-derived-from-one-registry*; its gating and sample-mode
sections still hold.

## Context

PR #15563 merged the admin into fewer pages with tabs, derived from `routes/platform/admin-pages.ts`, and
gave six section parents an overview page. PR #15727 was moving in-page tabs into the sidebar at the same
time, and the two collided. The overviews repeated what the child pages already show, and a section that
lives on `?tab=` is invisible to the sidebar's path-based active state.

## Why

A path per section makes the sidebar's active state, deep links and the browser Back button work without a
tab-aware special case, and the nav stays a literal a reader can scan top to bottom. The registry was the
rejected alternative: it removed drift between nav, routes and gates, but needed `isHidden`, `hideInNav`,
`activeTabId` and `isCrowned` to describe a shape that a path per page expresses directly.

## Consequences

- Nav, routes and gates live in three places again (`sidebar/platform/index.tsx`, `platform-routes.tsx`,
  and the page), so a new admin page has to be added to all three.
- Old `?tab=` links are rewritten to the new paths by `LegacyTabRedirect`, one `*_TAB_PATHS` map per
  promoted page. The `?tab=` URLs #15563 introduced (`/platform/users?tab=sso`, `/platform/security?tab=…`)
  were live for a day and are not redirected.
- The sample-data overlay that the registry applied per page now sits on the route, via
  `routes/platform/plan-feature-sample.tsx`. A locked page that is not wrapped there renders unlocked,
  because the pages themselves no longer carry a `LockedFeatureGuard`.
