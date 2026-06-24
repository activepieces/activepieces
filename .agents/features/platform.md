# CE Platform Configuration

## Summary
A Platform is the top-level tenant namespace in Activepieces. Every installation has at least one platform. It owns branding (logo, colors, favicon), authentication settings (email auth toggle, allowed auth domains, federated SSO providers), piece filtering rules (including per-piece action and trigger visibility), and a `PlatformPlan` that governs feature flags and resource limits. On Cloud a user can own multiple platforms; on CE/EE there is typically one. Platform admins can update branding, auth settings, piece pinning, and per-action/trigger visibility. Platform deletion is Cloud-only and triggers async cleanup.

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

## Edition Availability
All editions. The `PlatformPlan` feature flags (e.g. `customAppearanceEnabled`, `ssoEnabled`, `agentsEnabled`) control which capabilities are active. Community edition uses `OPEN_SOURCE_PLAN` with all booleans set to their CE defaults. `usage` is only populated on non-Community editions.

## Domain Terms
- **Platform** — tenant root; owns branding, auth config, piece filters
- **PlatformPlan** — separate record (in EE module) storing feature flags, limits, Stripe subscription state
- **FilteredPieceBehavior** — `ALLOWED` (allowlist) or `BLOCKED` (blocklist) applied to `filteredPieceNames`
- **federatedAuthProviders** — JSONB column storing OAuth2 / SAML config; sensitive fields (secrets, certs) are stripped before returning `PlatformWithoutSensitiveData`
- **pinnedPieces** — ordered list of piece names shown at the top of the piece selector
- **cloudAuthEnabled** — whether platform-managed OAuth (Activepieces-hosted app credentials) is active
- **PieceSelectorConfig** — JSONB config controlling the order, visibility, names, and icons of the piece-selector tab strip in the flow builder; `null` means use the default built-in layout
- **PieceSelectorTabConfig** — a single tab entry: either `BUILTIN` (referencing one of the five built-in tabs) or `CUSTOM` (a user-created tab with its own ordered piece list and optional sections)
- **PieceSelectorTabSection** — a named sub-group inside a `CUSTOM` tab; holds a title and an ordered list of piece names
- **filteredActionNames** — JSONB blocklist keyed by piece name; each value is a list of action names hidden from that piece's metadata response (EE/Cloud only, applied by `enterpriseFilteringUtils`)
- **filteredTriggerNames** — same structure as `filteredActionNames` but for trigger names

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
| filteredActionNames | jsonb | `Record<pieceName, actionName[]>` — actions hidden per piece (EE/Cloud only) |
| filteredTriggerNames | jsonb | `Record<pieceName, triggerName[]>` — triggers hidden per piece (EE/Cloud only) |

## Endpoints

| Method | Path | Security | Description |
|---|---|---|---|
| GET | `/v1/platforms/:id` | publicPlatform (USER, SERVICE) | Get platform with plan and usage (sensitive SSO data stripped) |
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
