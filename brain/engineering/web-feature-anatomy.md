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
- **A ref assigned during render (`const ref = useRef(x); ref.current = x`) is stale inside socket/event callbacks.** The value only advances when React commits a render, so two events handled before that commit both read the same base — a read-modify-write (merging a step into `run.steps`) silently drops the earlier event. Read the zustand store directly instead: `useBuilderStore().getState()` (`app/builder/builder-hooks.ts`) always returns current state. Bit the test-flow widget's progress merge, PR #14453.
- **Builder overlays share one stacking context, so a big `z-` wins over everything — including portalled popovers.** Nothing between an overlay in the canvas panel and `<body>` creates a stacking context (the middle panel is `relative` + `z-auto`; `ResizablePanel` sets only flex/overflow), so a canvas child's `z-index` competes directly with Radix portals. The working ladder: canvas `z-30` (opaque `bg-builder-background` — anything below it is invisible), header and floating corner chrome `z-40`, data selector / canvas controls / popovers `z-50`. That is why the powered-by note at `z-10000` painted over the piece selector.
- **The flow "download as image" only captures `.react-flow__viewport`.** `flowScreenshotUtils` (`flow-canvas/utils/flow-screenshot-utils.ts`) clones that one element into an SVG, so anything outside it — the dot-grid background, the powered-by note, canvas controls — is absent unless handled explicitly. Two seams: mark in-viewport chrome you want *omitted* (step chevron, badges) with `data-flow-screenshot-exclude`; anything *outside* the viewport you want *included* has to be redrawn onto the composited 2D canvas in `composeImageWithCanvasBackground` (that's how the background dots and the powered-by mark get there).
- **`ViewportPortal` content is deleted from the exported image on purpose.** The same clone step,
  `isCapturedElement` in `flow-screenshot-utils.ts`, drops any element carrying `react-flow__viewport-portal`
  — that is where `AboveFlowWidgets` lives, and it is chrome, not flow. So canvas *decoration* that must
  appear in the export (the batch-region hairline, anything painted behind the steps) cannot be a viewport
  portal: make it a react-flow node with `selectable: false`, `draggable: false` and a low `zIndex` — nodes
  are cloned, pan and zoom for free, and stay out of layout as long as the new `ApNodeType` is absent from
  `doesNodeAffectBoundingBox` and from `AP_NODE_SIZE`.
- **A canvas node component must not be typed `Omit<ApXNode, 'position'>`.** Node types that pin literals
  (`selectable: false`, `draggable: false`, as `ApBatchRegionNode` does) make the component unassignable to
  react-flow's `NodeTypes` index signature — `boolean | undefined` is not `false`, and the error surfaces at
  the `nodeTypes` map in `flow-canvas/index.tsx`, not at the component. Type the props the way `step-node`
  does: `NodeProps & Pick<ApXNode, 'data' | 'id'>` — take the identity/data fields from the node type, and
  everything react-flow injects from `NodeProps`.
- **Keeping the batch region out of `doesNodeAffectBoundingBox` is also what guarantees two batches in
  sibling router branches never collide.** The region's cross extent is exactly its branch's bounding box
  ±`CROSS_PADDING` (16), and `computeRouterChildOffsets` spaces branch bounding boxes by `routerBranchGap`
  — 80 vertical, 100 horizontal. So the clearance between two side-by-side regions is a constant
  `gap − 32`: **48px vertical, 68px horizontal**, invariant rather than incidental, because both numbers
  are derived from the same node set. Nothing widens a branch to make room for a region, and nothing needs
  to. The lever if it ever has to change is `CROSS_PADDING` in `flow-canvas/utils/batch-region.ts`, and it
  cannot exceed half the router branch gap. Pinned by `clears its sibling branch` in
  `test/app/builder/flow-canvas/utils/batch-region.test.ts`. **Do not reuse that 48 for a region facing an
  ordinary step** — only one side pads there, so the clearance is `gap − 16` = **64px vertical, 84px
  horizontal**. Two different invariants that look like one.
- **The clearance invariant has no along-axis counterpart: sibling regions are ragged, not aligned.** Router
  branches are never padded to a common length — the shorter branch's end edge just draws a longer
  `verticalSpaceBetweenLastNodeInBranchAndEndLine` down to the merge. So two batches in sibling branches
  share a top (both regions start one `HEADER_GAP` below their own batch step, which the router puts on one
  row) but bottom out wherever their own bodies end: one extra child step in one branch is **120px** of
  bottom mismatch, and the shorter region's lower edge lands mid-way down the taller one with the branch's
  own wire running past it. Anything that wants two sibling containers to look like a matched pair has to
  change *router* layout, not `batch-region.ts` — the region only ever knows its own members. Mocked from
  live `createFlowGraph` geometry in `.scratch/batch-region-hairline/prototypes/14-side-by-side-uneven.svg`.
- **`LOOP_RETURN_NODE` is an invisible spacer that claims a full step box, so anything deriving *drawn*
  geometry from node boxes hugs a phantom.** `ApLoopReturnCanvasNode` renders `bg-transparent` at
  `height: 1px` and is commented "used purely to help calculate the loop graph width", but
  `AP_NODE_SIZE.LOOP_RETURN_NODE` declares `FLOW_CANVAS_STEP_HEIGHT × FLOW_CANVAS_STEP_WIDTH` and it passes
  `doesNodeAffectBoundingBox`. Both are correct *for layout* — the spacer reserves the width the return arc
  needs. They are wrong for any outline meant to trace what the user can see: a loop nested inside a batch
  made the region bulge 156px left around nothing, on the band below a right-side bulge for the loop's own
  children, so the hairline zigzagged and the notch landed 204px in from the region's left edge. The rule:
  bounding-box membership and silhouette membership are different questions — reshape the spacer at the
  drawing site (`batch-region.ts`), never by editing `doesNodeAffectBoundingBox`. What the region traces is
  the spacer's *drawn* geometry, not its box: the return rail is a zero-width line at the handle centre
  (`x + STEP_WIDTH/2`), and it spans the loop's child height, which the spacer sits at the *centre* of
  (`position.along = loop.along + stepAlongSize + loopOffsetAlong + childHeight/2`) — so the rail's along
  span is symmetric around it, `alongEnd = 2 * along - railTop`. Feeding that zero-width box in is what
  makes the batch hairline enclose a nested loop's left rail instead of cutting through it. Second half of
  the trick: a hairline box must push the *near* edge out without defining the *far* edge, so `buildBands`
  computes `crossEnd` from `solid` boxes only (`crossEnd > crossStart`) and fills each side from its own
  nearest non-null neighbour. Skip that and the slices below the loop's last child stop being "empty",
  lose the inherited wide right edge, and the region snaps back to spine width straight through the loop's
  own return wire.
- **The builder's dark theme moves `--primary` from purple to blue, and no canvas edge ever carries run
  colour.** `--primary` is `257 74% 57%` (#6E40E3) in `:root` but `210 90% 50%` (#0D7FF2) in `.dark`
  (`styles.css`), so anything styled `stroke-primary` / `fill-primary` / `bg-primary` changes *hue*, not
  just lightness, between themes — a value read off a light-mode mock cannot simply be darkened. Because
  `--builder-background` flips with it (`#fbfbfb` → `hsla(0,0%,9%,1)`), an alpha chosen in light mode
  usually survives: the batch hairline's 40% measures 1.89:1 light vs 1.76:1 dark. Separately,
  `.react-flow` pins `--xy-edge-stroke: rgba(163,163,163,0.5) !important` for *every* edge in both themes —
  run status lives only on step-node badges (`ApStepNodeStatusInRun`), never on the wires — so canvas
  decoration is free to use primary without competing with a run palette.
- **Container geometry on the canvas is decoration, not behaviour — two places where that surprises you.**
  (1) *Nothing is a drop target except add buttons*: `flow-drag-layer.tsx` resolves every drop from the
  `ApButtonData` on an add button, so the loop's offset lane only ever *correlated* with "inside the loop".
  Laying a container's children out inline costs nothing mechanically; what it costs is the read, which then
  has to be paid back in hover/drag/selection feedback. (2) *Deleting a container deletes its children*:
  `_deleteAction` (`packages/core/execution/.../operations/delete-action.ts`) reassigns
  `parentStep.nextAction = container.nextAction`, so the whole `firstLoopAction` subtree goes with it — it is
  **not** spliced into the parent chain — and the builder has **no undo**. Both bit the batch-region redesign.
- **The canvas layout algorithm is implemented twice, and only one copy is in `packages/web`.** `flow-canvas/utils/flow-canvas-utils.ts` builds the `ApGraph` the builder renders; `flowCanvasUtils.computeStepPositions` in `packages/core/execution/src/lib/flows/util/flow-canvas-util.ts` re-derives the same x/y for every step server-side, and the MCP `ap_flow_structure` tool reports those coordinates to an LLM. They share only the `FLOW_CANVAS_*` constants — the container/router offset maths is duplicated line for line, so changing how a step type is laid out in the builder silently drifts the MCP copy. Decide explicitly whether to fork both; the MCP positions are an approximation used for note placement, so leaving it behind is defensible, but do it knowingly rather than by not noticing the second copy exists.
- **The piece-selector popover sizes its list to fit the viewport, but the fit needs slack or it clips against the screen edge.** `useAdjustPieceListHeightToAvailableSpace` (`features/pieces/utils/piece-selector-utils.ts`) measures the room above vs. below the trigger, renders the list on whichever side has more, and clamps the height to `[MIN 100, MAX 300]`. That measurement alone still let the popover butt flush against the top/bottom of the builder on short screens (the Radix content + its own padding/offset overran the raw available space). The fix is a `PIECE_SELECTOR_CLIPPING_THRESHOLD` (20px) subtracted from the computed `listHeight` at the call site in `builder/pieces-selector/index.tsx`, leaving a margin so the popover never touches the viewport edge. If it clips again, that constant — not the min/max clamp — is the lever.
- **Never run bare `npx prettier --write` on a `packages/web` file — it will fail lint.** The repo's `.prettierrc` sets only `singleQuote`, but `packages/web/.eslintrc.json` passes its own options to the `prettier/prettier` rule (`trailingComma: "all"`, `printWidth: 80`, `tabWidth: 2`). The installed prettier is 2.8.4, whose default `trailingComma` is `es5`, so the CLI strips exactly the trailing commas eslint then demands back. Either format with the matching flags (`npx prettier --write --single-quote --trailing-comma all --print-width 80 --tab-width 2 <file>`) or just use `npx turbo run lint --filter=web` / `npm run lint-dev`, which auto-fix through eslint and are the only source of truth.
- **Web tests run in vitest's `node` environment with no jsdom and no `@testing-library/react`** (`packages/web/vitest.config.ts`), so a component cannot be rendered in a test. Test the pure logic instead: pull it into a sibling `*-utils.ts` exporting one grouped const and mirror it under `test/app/...` — `run-details/truncated-input-utils.ts` and `run-details/iteration-rail-utils.ts` are the pattern. Do not add jsdom to test one component.
- **`test/features/chat/lib/chunk-reducer.test.ts` fails to collect on `main`** (`ReferenceError: window is not defined`, via `features/projects/stores/project-collection.ts` → `components/providers/embed-provider.tsx`, which reads `window.opener` at module scope in the node test env). `npm test` in `packages/web` therefore exits non-zero with "1 failed | 47 passed" while every individual test passes. Pre-existing since #14540 — don't chase it as a regression from your change.
- **`npx turbo run serve --filter=web -- --mode=cloud` cannot do OAuth2 connections.** The provider redirects to `cloud.activepieces.com` after sign-in instead of your local frontend. Use API-key or basic-auth connections, or run a fully local backend.
