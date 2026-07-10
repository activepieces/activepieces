# CE Platform Configuration

## Summary
A Platform is the top-level tenant namespace in Activepieces. Every installation has at least one platform. It owns branding (logo, colors, favicon), authentication settings (email auth toggle, allowed auth domains, federated SSO providers), piece filtering rules, and a `PlatformPlan` that governs feature flags and resource limits. On Cloud a user can own multiple platforms; on CE/EE there is typically one. Platform admins can update branding, auth settings, and piece pinning. Platform deletion is Cloud-only and triggers async cleanup.

## Key Files
- `packages/server/api/src/app/platform/platform.controller.ts` — POST `/:id` (update), GET `/:id` (read), DELETE `/:id` (Cloud only), GET `/assets/:id` (logo/favicon download)
- `packages/server/api/src/app/platform/platform.service.ts` — CRUD service; `create`, `update`, `getOneWithPlanAndUsageOrThrow`, `listPlatformsForIdentityWithAtleastProject`
- `packages/server/api/src/app/platform/platform.entity.ts` — `platform` TypeORM entity
- `packages/server/api/src/app/platform/platform.utils.ts` — `getPlatformIdForRequest`, `isCustomerOnDedicatedDomain`
- `packages/server/api/src/app/platform/platform-jobs.ts` — `HARD_DELETE_PLATFORM` job handler
- `packages/core/shared/src/lib/management/platform/platform.model.ts` — `Platform`, `PlatformWithoutSensitiveData`, `PlatformPlan`, `PlatformUsage`, `PlatformThemeColors`, `PieceSelectorConfig`, `PieceSelectorTabConfig`, `PieceSelectorTabSection` Zod schemas
- `packages/core/shared/src/lib/management/platform/platform.request.ts` — `UpdatePlatformRequestBody`
- `packages/web/src/hooks/platform-hooks.ts` — `useCurrentPlatform()` React Query hook
- `packages/web/src/features/platform-admin/hooks/branding-hooks.ts` — branding mutation hooks
- `packages/web/src/features/platform-admin/hooks/platform-pieces-hooks.ts` — `platformPiecesMutations`: `useTogglePieceVisibility`, `useTogglePiecePin`, `useBulkSetPiecesVisibility`, `useUpdatePieceSelectorConfig`, `useSyncPieces`
- `packages/web/src/app/routes/platform/setup/pieces/piece-actions.tsx` — per-piece eye (visibility) / pin icon buttons
- `packages/web/src/app/routes/platform/setup/pieces/bulk-visibility-actions.tsx` — bulk Show/Hide actions for a multi-selected set of pieces

## Edition Availability
All editions. The `PlatformPlan` feature flags (e.g. `customAppearanceEnabled`, `ssoEnabled`, `agentsEnabled`) control which capabilities are active. Community edition uses `OPEN_SOURCE_PLAN` with all booleans set to their CE defaults. `usage` is only populated on non-Community editions.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **Platform** — tenant root; owns branding, auth config, piece filters
- **PlatformPlan** — separate record (in EE module) storing feature flags, limits, Stripe subscription state
- **FilteredPieceBehavior** — `ALLOWED` (allowlist) or `BLOCKED` (blocklist) applied to `filteredPieceNames`
- **federatedAuthProviders** — JSONB column storing OAuth2 / SAML config; sensitive fields (secrets, certs) are stripped before returning `PlatformWithoutSensitiveData`
- **pinnedPieces** — ordered list of piece names shown at the top of the piece selector
- **cloudAuthEnabled** — whether platform-managed OAuth (Activepieces-hosted app credentials) is active
- **PieceSelectorConfig** — JSONB config controlling the order, visibility, names, and icons of the piece-selector tab strip in the flow builder; `null` means use the default built-in layout
- **PieceSelectorTabConfig** — a single tab entry: either `BUILTIN` (referencing one of the five built-in tabs) or `CUSTOM` (a user-created tab with its own ordered piece list and optional sections)
- **PieceSelectorTabSection** — a named sub-group inside a `CUSTOM` tab; holds a title and an ordered list of piece names

## Piece Visibility Filter (Hide/Show)

Hiding a piece via the platform admin Pieces eye icon (or bulk Hide) adds it to `filteredPieceNames` under `FilteredPieceBehavior.BLOCKED` — the only behavior ever reachable in practice, since no frontend path sets `filteredPieceBehavior` to `ALLOWED` (it's fixed at platform creation, `platform.service.ts`). This is nominally a **catalog-visibility** action: it governs which pieces can be newly added to a flow in the builder.

In practice it can also silently disable **already-active** flows that reference the hidden piece, but only when a worker container resolves that flow with no local piece-cache entry for that exact `(pieceName, version, platformId)` — `piece-cache.ts` (sandbox) persists resolved pieces to the container's local disk with no expiry, so a container that already resolved the piece keeps succeeding indefinitely even after it's hidden. The disable only surfaces on the next container that hits a genuine cache miss (post-deploy, autoscale-up, OOM restart, node eviction) — which happens routinely on Cloud, just not deterministically or immediately after the hide action. This makes the failure intermittent and easy to miss when testing on a single long-lived box (see activepieces/activepieces#13768).

`piece-actions.tsx` (single) and `bulk-visibility-actions.tsx` (bulk) confirm before hiding, via `ConfirmationDeleteDialog` with a static warning — matching the existing precedent in `DeleteConnectionWarning` (`components/custom/global-connection-utils.tsx`) rather than computing a live affected-flow count. Un-hiding (Show) never warns; it isn't destructive.

**Known follow-up (not yet built):** the worker's `disableFlow` RPC (`worker-rpc-service.ts`) that actually flips a flow to `DISABLED` for this reason only logs a `log.warn` today — there is no user-facing signal when it fires, and since it can land long after (and disconnected from) the original hide action, an admin has no way to discover it happened short of noticing the flow is off.

## Entity

### `platform` (`PlatformEntity`)
| Column | Type | Notes |
|---|---|---|
| id | string | ApId |
| ownerId | string | FK to `user` |
| name | string | display name |
| primaryColor | string | hex color for UI theme |
| themeColors | jsonb (nullable) | partial `PlatformThemeColors` overrides merged over the generated theme; null = fully derived from `primaryColor` |
| logoIconUrl | string | small logo asset URL |
| fullLogoUrl | string | full logo asset URL |
| favIconUrl | string | favicon asset URL |
| cloudAuthEnabled | boolean | default true |
| filteredPieceNames | string[] | allow/block list |
| filteredPieceBehavior | string | `FilteredPieceBehavior` enum |
| allowedAuthDomains | string[] | email domain allowlist |
| enforceAllowedAuthDomains | boolean | |
| emailAuthEnabled | boolean | |
| federatedAuthProviders | jsonb | OAuth2 + SAML config |
| pinnedPieces | string[] | ordered piece name list |
| pieceSelectorConfig | jsonb (nullable) | piece-selector tab layout (`PieceSelectorConfig`); null = default built-in tabs |

## Endpoints

| Method | Path | Security | Description |
|---|---|---|---|
| GET | `/v1/platforms/:id` | publicPlatform (USER, SERVICE) | Get platform with plan and usage (sensitive SSO data stripped). For USER principals, `plan.chatEnabled` is rewritten to the **effective per-user** chat visibility (`chatVisibilityHelper.resolveChatEnabledForUser` — edition + embed + cloud rollout/grandfather), and `licenseKey` is nulled for embedded users |
| POST | `/v1/platforms/:id` | platformAdminOnly (USER) | Update branding, auth settings, piece filters |
| DELETE | `/v1/platforms/:id` | platformAdminOnly (USER) | Cloud only: mark projects for deletion and schedule hard delete |
| GET | `/v1/platforms/assets/:id` | public | Download a platform asset (logo/favicon) by file ID |

## Service Methods

### `platformService`
- `create({ ownerId, name, primaryColor?, logoIconUrl?, fullLogoUrl?, favIconUrl? })` — creates platform record with defaults from `defaultTheme`; calls `userService.addOwnerToPlatform`
- `update(params)` — merges fields; if `plan` is set delegates to `platformPlanService.update`; if SAML config changes, clears SAML client cache
- `getOneWithPlanAndUsageOrThrow(id)` — full read with plan feature flags and usage metrics
- `getOneWithPlanOrThrow(id)` — plan flags only (no usage); used in auth guards for fast plan checks
- `listPlatformsForIdentityWithAtleastProject({ identityId })` — returns all platforms where the identity has at least one accessible project; used for platform-switcher
- `getOldestPlatform()` — used in CE for single-platform setup resolution

## Side Effects
- On `update` with branding files: `fileService.uploadPublicAsset` is called for logo/icon/favicon before saving
- On Cloud `DELETE`: marks all projects for deletion via `platformProjectService.markForDeletion`, then schedules a `HARD_DELETE_PLATFORM` system job
- Updating SAML provider config invalidates the cached SAML client via `invalidateSamlClientCache`
