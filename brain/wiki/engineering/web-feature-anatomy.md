---
icon: 🎛️
---

# Web Feature Anatomy

What a frontend feature looks like in `packages/web/src/`. The canonical reference is `features/tables/` — when this page and that folder disagree, the folder wins.

## Feature folder

```
features/{feature}/
  api/          # api clients — tables-api.ts, fields-api.ts
  components/   # React components
  hooks/        # react-query hooks — table-hooks.ts
  stores/       # zustand stores, when the feature has client state
  types/
  utils/
  index.ts      # barrel — the feature's public surface
```

Everything crossing the feature boundary goes through `index.ts`. See `features/tables/index.ts`: React components are exported **by name** (`ApTableHeader`, `ImportTableDialog`), while plain function/constant utils are grouped into one object first (`tablesApi`, `tableHooks`) and re-exported as that object.

## API client and hooks

API client: `features/tables/api/tables-api.ts`. Hooks: `features/tables/hooks/table-hooks.ts`.

On any query that fetches a page's **primary** data — the table rows, the list, the thing the page exists to show — set `meta: { showErrorDialog: true }`. `QueryCache.onError` in `app/query-client.ts` turns that into the global error dialog. Leave it off for auxiliary queries (feature flags, piece metadata, single-item fetches, filter options, user details) — those should fail silently rather than throw a modal over the page.

## Route

Routes are registered in `app/routes/project-routes.tsx`, composed from `ProjectRouterWrapper` plus guards:

```tsx
...ProjectRouterWrapper({
    path: routesThatRequireProjectId.myFeature,
    element: (
        <RoutePermissionGuard requiredPermissions={Permission.READ_MY_FEATURE}>
            <PageTitle title="My Feature">
                <SuspenseWrapper>
                    <MyFeaturePage />
                </SuspenseWrapper>
            </PageTitle>
        </RoutePermissionGuard>
    ),
}),
```

The page component itself is `React.lazy()`-imported. `requiredPermissions` takes a single `Permission` or an array. Guards live in `app/guards/` — `permission-guard.tsx`, `flag-route-guard.tsx`, `project-route-wrapper.tsx`.

## Flags, gating, translations

- Feature flags: `flagsHooks.useFlag()`, or `<FlagGuard>` / `flag-route-guard.tsx` for whole routes.
- Paid features: `LockedFeatureGuard` on the frontend, `enabled: platform.plan.<flag>` on the query. The backend counterpart is `platformMustHaveFeatureEnabled()`, which returns 402.
- Translations go in `packages/web/public/locales/en/translation.json` **only** — the other locales are generated. Zod validation messages must be keys in that file, not raw English; reuse the `formErrors` constant from `@activepieces/shared` for common ones.

## Editions

Every customer-facing surface must be checked on all five edition paths — CE, EE self-hosted, Cloud freemium, Cloud self-serve paid, Cloud enterprise. Nothing user-visible hardcodes "Activepieces": name, colours, and logos come from platform appearance. Community always gets the default theme, Cloud always applies platform branding, EE requires `platform.plan.customAppearanceEnabled`. See `ee/helper/appearance-helper.ts`.

Verify with `npx turbo run lint --filter=web`, or `npm run lint-dev` for the whole repo.

## Gotchas

- **Exported types and constants belong at the *end* of the file**, after the components and logic. Reading a file should start with what it does, not its type declarations.
- **`showErrorDialog` on the wrong query is worse than missing it.** On an auxiliary query it throws a modal over a page that was working fine; on the primary query, omitting it leaves the user staring at an empty table with no explanation.
- **`npx turbo run serve --filter=web -- --mode=cloud` cannot do OAuth2 connections.** The provider redirects to `cloud.activepieces.com` after sign-in instead of your local frontend. Use API-key or basic-auth connections, or run a fully local backend.
