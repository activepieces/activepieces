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

- **A `packages/web` test runs in the `node` environment by default, so importing anything that touches `window` at module load fails at collection.** `vitest.config.ts` sets `environment: 'node'`; ~26 suites opt into a DOM with a `// @vitest-environment jsdom` docblock on line 1. The failure is a bare `ReferenceError: window is not defined` pointing at a *transitive* import (`embed-provider.tsx` reading `window.opener`, reached via `@/features/projects`), not at the test — so read the stack, don't hunt in your own file. Missing the docblock is why `chunk-reducer.test.ts` was red for as long as it was: CI did not run the web suite at all, so nothing surfaced it.
- **Exported types and constants belong at the *end* of the file**, after the components and logic. Reading a file should start with what it does, not its type declarations.
- **`showErrorDialog` on the wrong query is worse than missing it.** On an auxiliary query it throws a modal over a page that was working fine; on the primary query, omitting it leaves the user staring at an empty table with no explanation.
- **A ref assigned during render (`const ref = useRef(x); ref.current = x`) is stale inside socket/event callbacks.** The value only advances when React commits a render, so two events handled before that commit both read the same base — a read-modify-write (merging a step into `run.steps`) silently drops the earlier event. Read the zustand store directly instead: `useBuilderStore().getState()` (`app/builder/builder-hooks.ts`) always returns current state. Bit the test-flow widget's progress merge, PR #14453.
- **Builder overlays share one stacking context, so a big `z-` wins over everything — including portalled popovers.** Nothing between an overlay in the canvas panel and `<body>` creates a stacking context (the middle panel is `relative` + `z-auto`; `ResizablePanel` sets only flex/overflow), so a canvas child's `z-index` competes directly with Radix portals. The working ladder: canvas `z-30` (opaque `bg-builder-background` — anything below it is invisible), header and floating corner chrome `z-40`, data selector / canvas controls / popovers `z-50`. That is why the powered-by note at `z-10000` painted over the piece selector.
- **The flow "download as image" only captures `.react-flow__viewport`.** `flowScreenshotUtils` (`flow-canvas/utils/flow-screenshot-utils.ts`) clones that one element into an SVG, so anything outside it — the dot-grid background, the powered-by note, canvas controls — is absent unless handled explicitly. Two seams: mark in-viewport chrome you want *omitted* (step chevron, badges) with `data-flow-screenshot-exclude`; anything *outside* the viewport you want *included* has to be redrawn onto the composited 2D canvas in `composeImageWithCanvasBackground` (that's how the background dots and the powered-by mark get there).
- **The piece-selector popover sizes its list to fit the viewport, but the fit needs slack or it clips against the screen edge.** `useAdjustPieceListHeightToAvailableSpace` (`features/pieces/utils/piece-selector-utils.ts`) measures the room above vs. below the trigger, renders the list on whichever side has more, and clamps the height to `[MIN 100, MAX 300]`. That measurement alone still let the popover butt flush against the top/bottom of the builder on short screens (the Radix content + its own padding/offset overran the raw available space). The fix is a `PIECE_SELECTOR_CLIPPING_THRESHOLD` (20px) subtracted from the computed `listHeight` at the call site in `builder/pieces-selector/index.tsx`, leaving a margin so the popover never touches the viewport edge. If it clips again, that constant — not the min/max clamp — is the lever.
- **`Alert`'s `warning` and `destructive` variants ship without a background tint, so a tinted banner has to add one at the call site.** `components/ui/alert.tsx` gives `primary` and `success` a `bg-*-100/10` wash but leaves `warning` and `destructive` transparent (`destructive` sets `bg-card`, which reads as a plain panel on a page background, and unlike `warning` it sets no border colour either). A banner that needs to look like a banner rather than a bordered paragraph passes `bg-warning-100/10` / `bg-destructive-100/10 border-destructive/50` itself — that is what the credits usage alert does. Don't "fix" it in the variant without looking: eight-plus existing warning alerts sit inside dialogs on card backgrounds and were designed against the untinted look. Note also that `--warning-100` and `--destructive-100` are *not* redefined in the `.dark` block of `styles.css` (unlike `--primary-100`), so in dark mode both tints are a very pale hue at 10% over near-black — subtle by accident, not by design.
- **`npx turbo run serve --filter=web -- --mode=cloud` cannot do OAuth2 connections.** The provider redirects to `cloud.activepieces.com` after sign-in instead of your local frontend. Use API-key or basic-auth connections, or run a fully local backend.
- **`--mode=cloud` also floods the terminal with `[vite] http proxy error: /ingest/... ETIMEDOUT 127.0.0.1:3000`.** The mode only redirects the API (`API_BASE_URL` → `https://cloud.activepieces.com` in `lib/api.ts`); PostHog still posts to the *relative* `api_host: '/ingest'` (a same-origin reverse proxy so ad blockers don't drop ingestion — `providers/telemetry-provider.tsx`, mirrored in prod by the `fastifyHttpProxy` in `server.ts`). Vite proxies `/ingest` to `127.0.0.1:3000`, which isn't running. Cloud flags also turn telemetry *on* (`TELEMETRY_ENABLED` + `EDITION=cloud`), unlike a local CE backend — so posthog-js keeps polling `/ingest/flags` and flushing `/ingest/e` every few seconds. Harmless, but note the same setup sends real dev clicks to production PostHog whenever `/ingest` does resolve; the clean fix is skipping `posthog.init` under `import.meta.env.DEV`.
- **`packages/web`'s lint script only globs `src/**`, so nothing under `packages/web/test/` is ever linted** — not by CI's `lint` job, not by `npm run lint-dev`. Running `npx eslint 'test/**/*.{ts,tsx}'` from `packages/web` today reports 21 errors nobody has seen, so a new web test needs a manual eslint pass or it ships with errors. Most common trap: `testing-library/render-result-naming-convention` fires on any local helper whose name merely *starts with* `render` even when testing-library is not involved — renaming `render` to `renderTabText` does not silence it, only a name that doesn't begin with `render` does.
