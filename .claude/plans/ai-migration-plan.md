# Version-aware AI provider migration — final plan

## Context

Activepieces ships an admin-run migration that rewrites AI provider/model across every flow on a platform — [AiProviderMigrationsTable](packages/web/src/app/routes/platform/setup/ai/model-migration/ai-provider-migrations-table.tsx) kicks off the job, [flow-version-migration.service.ts](packages/server/api/src/app/flows/flow-version/flow-version-migration.service.ts) rewrites each matched step's `input.provider` / `input.model` (or the agent equivalent under `input[AgentPieceProps.AI_PROVIDER_MODEL]`). The existing code silently produces broken flows because it is:

1. **Provider/model-naïve at the form level.** The dialog offers every model of a provider regardless of model type, so an admin can accidentally migrate `askAi` steps to an image model or vice versa. Backend has no guard either.
2. **Piece-version-naïve.** Never touches `step.settings.pieceVersion`. Provider support in [ai-sdk.ts](packages/pieces/community/ai/src/lib/common/ai-sdk.ts) grew over time (cloudflare-gateway at 0.0.3, custom at 0.0.4, bedrock at 0.3.6 — all on npm). Flows pinned below the support boundary fall through to `default: throw` at runtime after migration.
3. **Flow-schema-version-naïve.** Operates on flow versions pulled directly from the DB. A stale-schema flow (e.g. `schemaVersion < 15` with old-shape `run_agent` input `{provider, model}`) is silently mis-handled today, and worse — any `pieceVersion` bump we write gets clobbered the next time [migrate-v15-agent-provider-model.ts](packages/server/api/src/app/flows/flow-version/migrations/migrate-v15-agent-provider-model.ts) runs on flow load and unconditionally pins to `0.1.0`.
4. **Input-shape-naïve.** Provider-specific keys in `generateImage.advancedOptions` and `askAi` / `runAgent` `webSearchOptions` are carried verbatim across providers. Cross-model OpenAI migration can send invalid enum values (`quality: 'hd'` to `dall-e-2` → 400). Cross-provider migration to a non-web-search-capable provider (`azure` / `custom` / `bedrock`, plus `cloudflare-gateway` with an unknown submodel) with `webSearch: true` throws at runtime.
5. **Non-transparent.** No preview before committing, no per-flow breakdown after. Admin clicks Migrate and finds out what happened when flows fail at runtime.

**Precondition met (already on this branch):** [getEffectiveProviderAndModel](packages/shared/src/lib/management/ai-providers/index.ts) was added via the CF-gateway submodel parity PR. Cloudflare-gateway with an `openai/*`, `anthropic/*`, `google-ai-studio/*`, or `google-vertex-ai/*` submodel is now treated identically to the underlying native provider for `advancedOptions`, `webSearchOptions`, the web-search tool constructor, and the `openaiResponsesModel` flag. This plan leans on that helper directly — no stub, no future-migration code path.

Goal: the admin sees what will change before they commit, the migration itself only makes safe, well-defined transformations, and the post-migration results surface every change in the same level of detail as the preview. Future provider additions to the piece don't silently break the migration — enforcement is a CI test.

## Approach summary

- **"Migrate Image Models" checkbox** at the top of the dialog (unchecked = `AIProviderModelType.TEXT`, checked = `AIProviderModelType.IMAGE`). The field is named `aiProviderModelType` everywhere — matching the enum name, no new term coined. Uses the existing `AIProviderModelType` enum from [packages/shared/src/lib/management/ai-providers/index.ts](packages/shared/src/lib/management/ai-providers/index.ts). Toggling clears both source and target model selections and **filters the provider dropdowns to exclude any provider that has zero models of the selected type** (so e.g. Anthropic disappears from the dropdown when the checkbox is ticked, since it has no image models).
- **Schema chain first, provider migration second.** For each flow version, run `flowVersionMigrationService(log).migrate(flowVersion, projectId)` before building any operations. Idempotent (no-op when already at `LATEST_FLOW_SCHEMA_VERSION`); eliminates the race with pending schema migrations and fixes the silent-skip bug on old `run_agent` inputs.
- **Planner is pure.** Given `(migratedFlowVersion, sourceModel, targetModel, aiProviderModelType, platformId, projectId)`, it returns `PlannedFlowChange[]` — each entry either a set of step-level operations plus a structured diff, or a `blocked` reason. Used for both dry-check (read-only) and the real run.
- **Always bump `pieceVersion` to the latest installed version of `@activepieces/piece-ai`.** Every migrated step ends up on the latest installed piece-ai on the platform, regardless of whether the bump was strictly required for target-provider support. **Empirically verified** across all 39 published npm versions (0.0.1 → 0.3.6) that (a) no new required top-level input prop was ever added, (b) every action's return shape is byte-identical, and (c) the one stored-input rename (run-agent `provider`/`model` → `aiProviderModel` at 0.0.9 → 0.1.0) is handled by flow-schema migrations v14/v15. Bumping therefore carries bug fixes, model-list updates, and new provider support without risk of schema corruption. If the current version already equals the latest installed, this is a no-op. If the latest installed *doesn't* happen to support the target provider (no such case today, but guard for the future), fall back to the latest installed version that does; if none → Blocked.
- **Capability checks go through `getEffectiveProviderAndModel`.** For every decision that depends on what the target provider supports (web-search code path, image-gen path, advancedOptions schema), the planner first resolves the effective `(provider, model)` pair. CF-gateway/openai is OpenAI; CF-gateway/anthropic is Anthropic; etc. No provider-specific branching in the planner — we delegate to the shared helper the piece already uses.
- **Field handling.** For `generateImage.advancedOptions` — **clear the whole object** on any provider-or-model change. For `webSearchOptions` — **rebuild as a new object carrying only `maxUses` and `includeSources`** (if they exist on the source; otherwise an empty object). For the top-level `webSearch` boolean — **turn it off and clear `webSearchOptions`** only when the *effective* target provider has no web-search code path at all (`azure` / `custom` / `bedrock`, plus `cloudflare-gateway` with a submodel that doesn't map to a web-search-capable provider — in practice: CF with openrouter-style prefixes or unrecognized prefixes).
- **Dry-check and real migration are always separate `FlowMigration` records.** Same `FlowMigrationType.AI_PROVIDER_MODEL`, same worker code path, same BullMQ job type — distinguished only by `params.dryCheck: boolean`. Each record has its own id, its own job, its own `COMPLETED` state, and its own `migratedVersions` / `failedFlowVersions` arrays. The dry-check record's arrays describe what the planner *would* do; the real migration's arrays describe what it *did* do. A dry-check is never "promoted" or "continued" — to run for real, the admin submits a **new** migration with `dryCheck: false`. Same params, independent rows.
- **Two entry points to the migrate dialog**, same component with two distinct modes:
  - **New-migration mode** (opened from the "Migrate Flows" button): the form is fully editable. A `"Run a dry-check first (recommended)"` checkbox defaults to **checked**.
    - Checkbox on: clicking **Run migration** enqueues `dryCheck: true`. Dialog shows an in-progress view, then the preview panel when the record flips to `COMPLETED`. The admin closes the dialog; the dry-check record stays in the migrations table for follow-up.
    - Checkbox off (power-user mode): clicking **Run migration** enqueues `dryCheck: false` directly. No preview, no follow-up.
  - **Confirm-real-migration mode** (opened from a "Run for real" button on any dry-check row in the migrations table): the dialog opens with every field pre-populated from the dry-check's `params` and fully disabled. The "Run a dry-check first" checkbox is hidden entirely. A banner at the top reads: *"Running the migration previewed in the dry-check on {date}. Values are locked — cancel and start a new migration if you need to change anything."* Primary action: **Run migration** (posts `dryCheck: false`). Cancel keeps the dry-check record intact for another attempt.
- **Why a flag, not a type.** The worker's code is identical either way except for the "persist the new flow version" branch; using a single type with a `dryCheck` flag avoids duplicating the handler, the status transitions, the job name, the pagination, etc. Users see the distinction as a "Dry-check" badge on the migrations table row.
- **Manifest + enforcement test.** A hand-maintained `AI_PIECE_PROVIDER_SUPPORT: Record<semver, AIProviderName[]>` in shared. A piece unit test iterates every `AIProviderName`, invokes `createAIModel` with a stubbed `fetchProviderConfig`, asserts throw-vs-no-throw matches the manifest's entry for the current `package.json` version. Adding a `case` to the switch without updating the manifest fails CI; removing one fails CI.
- **No DB migration.** `FlowMigration.migratedVersions` and `failedFlowVersions` are jsonb columns — we extend their entry schemas (in Zod) with optional fields; old records remain readable.

## Decisions (recap)

| Topic | Decision |
|---|---|
| Model-type guard | `"Migrate Image Models"` checkbox (unchecked = `AIProviderModelType.TEXT`, checked = `AIProviderModelType.IMAGE`). Field name everywhere: `aiProviderModelType`. Toggling resets source/target model selections and filters out providers that have zero models of the selected type. Planner scopes step-kinds. Controller verifies `sourceModel.type === targetModel.type === aiProviderModelType` via the `/v1/ai-providers/{provider}/models` lookup before enqueuing (server-side check, not a schema refine). |
| Pre-migration schema chain | Run `flowVersionMigrationService.migrate()` per flow version first. Idempotent; protects against stale-schema flows. |
| `pieceVersion` resolver | Always bump to the latest installed `@activepieces/piece-ai`. If latest doesn't support the target provider (none today), walk back to the highest installed version that does. If none support it → Blocked. Resolver computes `effectiveTargetProvider` via `getEffectiveProviderAndModel` first. |
| `generateImage.advancedOptions` | Clear wholesale on any provider/model change in an image migration. |
| `webSearchOptions` rebuild | Start from an empty object. If source has `maxUses`, copy it. If source has `includeSources`, copy it (askAi only; runAgent never stores it). Nothing else is carried over. |
| `webSearch` boolean when effective target can't do any web search | Set to `false` and clear `webSearchOptions`. "Can't do web search" = effective provider is one of `azure` / `custom` / `bedrock`, or `cloudflare-gateway` with an unknown submodel. |
| `webSearch` boolean when effective target can do web search | Leave alone. Includes CF-gateway with openai / anthropic / google submodels (now natively supported by the piece). |
| CF-gateway submodel parity | **Already merged on this branch.** `getEffectiveProviderAndModel` handles the submodel lookup; the planner uses it without any shim. |
| Dry-check | `dryCheck: boolean` flag on `params`. Dry-check and real runs are always **separate** `FlowMigration` records (never promoted or continued). Same type + same worker code; the flag only gates the flow-version persist. New-migration dialog defaults "Run a dry-check first (recommended)" checkbox to ON. Each dry-check row gets a "Run for real" action that re-opens the dialog in a locked confirm-mode (fields disabled, dry-check checkbox hidden, info banner). |
| Feature-adjusted gate | Acknowledgement checkbox when the bucket is non-empty. |
| Blocked flows | Surface with actionable reason (piece version needed, etc.); migration proceeds for non-blocked. |
| Post-migration reporting | Categorical counts + flow names with one-line consequence; technical details in per-flow expander. |
| Results entry detail | Add optional `newFlowVersionId` (post-migration version id; omitted on dry-check), `pieceVersionFrom`, `pieceVersionTo`, `changedFields: { clearedAdvancedOptions?, disabledWebSearch? }` to each `migratedVersions` entry. Add structured `reason` alongside existing `error` on `failedFlowVersions`. Existing `flowId` and `flowVersionId` (pre-migration version id) keep their current semantics. |

## Implementation

### 1. `@activepieces/shared`
- `packages/shared/src/lib/management/ai-providers/piece-version-support.ts` *(new)*:
  - `AI_PIECE_NAME = '@activepieces/piece-ai'`.
  - `AI_PIECE_PROVIDER_SUPPORT: Record<string, AIProviderName[]>` seeded with boundary entries: `0.0.1` (6 providers), `0.0.3` (adds cloudflare-gateway, openai_compatible), `0.0.4` (renames openai_compatible → custom), `0.3.6` (adds bedrock — already published on npm). Between those, the set is stable per empirical verification.
  - `providerSupportedByPieceVersion({ version, provider })` — nearest-predecessor semver lookup.
- `packages/shared/src/lib/automation/flows/dto/migrate-flow-model-request.ts`:
  - Add required `aiProviderModelType: z.nativeEnum(AIProviderModelType)` to `MigrateFlowsModelRequest`.
  - Add required `dryCheck: z.boolean()` to `MigrateFlowsModelRequest`.
  - No cross-field Zod refine. The model-type consistency check happens in the controller (see §5).
- `packages/shared/src/lib/automation/flows/dto/flow-migration.ts`:
  - Extend `AiProviderModelMigrationData` with `dryCheck: boolean` so it's persisted on `FlowMigration.params`.
  - Extend the `migratedVersions` element with:
    - `newFlowVersionId?: string` — the id of the new flow version created by the migration. Present only for real runs.
    - `pieceVersionFrom?: string`, `pieceVersionTo?: string`
    - `changedFields?: { clearedAdvancedOptions?: boolean, disabledWebSearch?: boolean }`
  - Doc-comment `flowVersionId` as the **pre-migration** version (unchanged semantics). The pre/post pair is sufficient for a future revert feature.
  - Extend the `failedFlowVersions` element: add optional `reason?: { code: 'NO_COMPATIBLE_PIECE_VERSION' | 'MODALITY_MISMATCH' | 'SCHEMA_MIGRATION_FAILED' | 'UNKNOWN', currentPieceVersion?: string, targetProvider?: string, minRequiredPieceVersion?: string }` alongside the existing `error` string.
- Bump `@activepieces/shared` minor.

### 2. AI piece — enforcement test
- `packages/pieces/community/ai/test/provider-support.test.ts` *(new)*:
  - Imports `createAIModel`, `AI_PIECE_PROVIDER_SUPPORT`, reads current `package.json` version.
  - Iterates `AIProviderName`, stubs `fetchProviderConfig` with a minimal valid config, calls `createAIModel`.
  - Asserts: throws with "Provider X is not supported" for every provider **not** in `AI_PIECE_PROVIDER_SUPPORT[currentVersion]`; does not throw for every provider in the list.
  - Fails if `AI_PIECE_PROVIDER_SUPPORT` has no entry for the current version — forces the manifest update when bumping.

### 3. Server — resolver
- `packages/server/api/src/app/flows/flow-version/ai-piece-version-resolver.ts` *(new)*:
  - `findCompatiblePieceVersion({ platformId, projectId, currentVersion, targetProvider, targetModel, log })`.
    - Computes `{ provider: effectiveTargetProvider } = getEffectiveProviderAndModel({ provider: targetProvider, model: targetModel })`.
    - Fetches installed versions via `pieceMetadataService(log).list({ name: AI_PIECE_NAME, platformId, projectId })`, sorted semver descending.
    - Returns the **maximum** installed version that supports `effectiveTargetProvider` per `AI_PIECE_PROVIDER_SUPPORT`. `null` if none support it.
  - Pure over inputs; trivially unit-testable against a stub metadata service.

### 4. Server — planner
- `packages/server/api/src/app/flows/flow-version/ai-migration-planner.ts` *(new)*:
  - `planFlowVersionChanges({ migratedFlowVersion, sourceModel, targetModel, aiProviderModelType, platformId, projectId, log }) → PlannedFlowChange[]`.
  - Walks steps via `flowStructureUtil.getAllSteps`. For each step that is an AI-piece step:
    - Scope by model type: for `aiProviderModelType === AIProviderModelType.TEXT` consider `askAi` / `summarizeText` / `classifyText` / `extractStructuredData` / `runAgent`; for `AIProviderModelType.IMAGE` consider only `generateImage`. Non-scoped steps are skipped.
    - Pull current `(provider, model)` from the correct storage location (top-level for most actions; `AgentPieceProps.AI_PROVIDER_MODEL` for `runAgent`).
    - Match source: skip if not equal.
    - Resolve piece version via `findCompatiblePieceVersion`. `null` → return `{ blocked: { code: 'NO_COMPATIBLE_PIECE_VERSION', currentPieceVersion, targetProvider, minRequiredPieceVersion } }`.
    - Build `newInput`:
      - Rewrite provider/model (top-level or nested per action).
      - If action is `generateImage` → `newInput.advancedOptions = {}`. Mark `clearedAdvancedOptions: true`.
      - If action is `askAi` or `runAgent`, consider `webSearch` / `webSearchOptions`:
        - Compute `{ provider: effectiveTargetProvider } = getEffectiveProviderAndModel({ provider: targetModel.provider, model: targetModel.model })`.
        - If `webSearch === true` and `effectiveTargetProvider` is in `{azure, custom, bedrock, cloudflare-gateway}` (no web-search code path — CF-gateway with unrecognized submodel lands here): set `newInput.webSearch = false`, `newInput.webSearchOptions = {}`. Mark `disabledWebSearch: true`.
        - Else if `webSearch === true`: build a fresh `newInput.webSearchOptions = {}`, copy `maxUses` from source if present, copy `includeSources` from source if present (askAi only). No other source keys carried over.
        - Else (webSearch off or undefined): leave alone.
    - Emit `{ stepName, operation: UPDATE_ACTION with both pieceVersion (if bumped) and newInput, diff: { pieceVersionFrom, pieceVersionTo, clearedAdvancedOptions, disabledWebSearch } }`.
  - Returns per-flow-version array, possibly empty.

### 5. Server — wire planner into the job
In [flow-version-migration.service.ts](packages/server/api/src/app/flows/flow-version/flow-version-migration.service.ts):
- Extend `enqueueMigrateFlowsModel` / controller to validate `aiProviderModelType` matches both source and target model types (fetched from `/v1/ai-providers/{provider}/models`). Reject with 400 on mismatch.
- In `migrateFlowsModelHandler`:
  - Batch query — additionally project `f."projectId"` into the id list.
  - Inside the per-version loop:
    ```ts
    const { data: migratedFv, error: schemaErr } = await tryCatch(() =>
      flowVersionMigrationService(log).migrate(flowVersion, projectId)
    );
    if (schemaErr) {
      failedFlowVersions.push({ ..., reason: { code: 'SCHEMA_MIGRATION_FAILED' }, error: schemaErr.message });
      continue;
    }
    const changes = await planFlowVersionChanges({ migratedFlowVersion: migratedFv, ... });
    ```
  - Split `changes` into `blockedChanges` and `applicableChanges`.
    - Any blocked → push into `failedFlowVersions` with structured `reason` + human-readable `error`, skip.
    - Otherwise for each `applicableChanges[i]`:
      - **If `migration.params.dryCheck === true`**: record the planned outcome into the in-memory `migratedVersions` aggregate exactly as a real run would, but **do not open the transaction, do not save the new flow version, do not update `publishedVersionId`**. Skip the `flowExecutionCache.invalidate` call. `newFlowVersionId` is left undefined.
      - **Otherwise (real run)**: apply each operation via `flowOperations.apply` in transaction, save the new version (its freshly-generated id becomes `newFlowVersionId` on the entry), update `publishedVersionId` if not draft, invalidate the cache.
    - Push `migratedVersions` entry aggregating per-flow: `flowVersionId` = pre-migration version id, `newFlowVersionId` = new version id (real runs only), `pieceVersionFrom` = original piece version, `pieceVersionTo` = max of per-step bumps, `changedFields` = union of per-step diffs.
- At the end of the handler the migration row ends up in `COMPLETED` status with a fully populated `migratedVersions` / `failedFlowVersions` either way. For a dry-check, those arrays describe "what *would* happen"; for a real run they describe what *did* happen.

### 6. Web — dialog, preview, table
- `packages/web/src/features/platform-admin/api/ai-provider-api.ts`: `migrateFlows` always posts to `/v1/flow-migrations`. Request body carries `dryCheck` like any other field.
- `packages/web/src/app/routes/platform/setup/ai/model-migration/migrate-flows-dialog.tsx` — the component accepts an optional `confirmFromDryCheck?: FlowMigration` prop. Absent → "new-migration mode"; present → "confirm-real-migration mode".
  - **New-migration mode**:
    - Title: "Migrate AI Model". Description: *"Migrate all flows on this platform from one AI provider or model to another. A dry-check previews every change without touching your flows — we recommend running one first on any migration that affects more than a handful of flows."*
    - `"Migrate Image Models"` `<Checkbox>` at the top. Toggling clears source/target model selections.
    - Source and target **provider** dropdowns filter to providers that have at least one model of the selected type (looked up against `/v1/ai-providers/{provider}/models` — providers with zero matching models are omitted). Model dropdowns then filter the selected provider's models by `type === aiProviderModelType`. Target provider/model disabled until source is chosen.
    - `"Run a dry-check first (recommended)"` `<Checkbox>` above the submit button, defaults to checked. Helper: *"A dry-check runs the migration against every flow without saving anything. Use the results to decide whether to proceed."*
    - Single primary action: **Run migration**.
      - Checked: posts with `dryCheck: true` → creates the dry-check record. Dialog transitions to an in-progress view ("Running dry-check on N flows…"), polling via the existing `useAiProviderMigrations`. When the record flips to `COMPLETED`, the preview panel replaces the spinner:
        - Summary bar: `N clean · M upgraded · P feature-adjusted · K blocked` (buckets derived client-side from `changedFields` / `reason`).
        - Each category expands to a per-flow list. Row = flow display name (linked to `/projects/{projectId}/flows/{flowId}` in a new tab) + one-line consequence. "Show details" toggle reveals `pieceVersionFrom/To`, etc.
        - The only action is **Close**. Proceeding happens from the migrations table.
      - Unchecked (power-user mode): posts with `dryCheck: false` directly, creating a single real-migration record.
    - When `aiProviderModelType === AIProviderModelType.IMAGE`: persistent info banner — *"Image migrations clear per-model advanced options (quality, size, background, input images). The previous flow version is preserved — you can review or revert it from the flow's version history."*
  - **Confirm-real-migration mode** (`confirmFromDryCheck` is a completed dry-check `FlowMigration`):
    - Title: "Run migration". Banner: *"Running the migration previewed in the dry-check on {formatDate(confirmFromDryCheck.updated)}. Values are locked — cancel and start a new migration if you need to change anything."*
    - All form fields pre-filled from `confirmFromDryCheck.params` and disabled.
    - The "Run a dry-check first" checkbox is not rendered.
    - When `P > 0` or `K > 0` in the dry-check: feature-loss / blocked-skip acknowledgement checkboxes render and gate the submit.
    - Image-migration banner still renders when `params.aiProviderModelType === AIProviderModelType.IMAGE`.
    - Primary action: **Run migration** (posts `dryCheck: false` with `confirmFromDryCheck.params`). Cancel keeps the dry-check record.
- `packages/web/src/app/routes/platform/setup/ai/model-migration/ai-provider-migrations-table.tsx`:
  - Dry-check rows (`params.dryCheck === true`) get a visible `<Badge>` ("Dry-check") and a **Run for real** action enabled only when status is `COMPLETED`.
  - Clicking **Run for real** opens the dialog in confirm-real-migration mode.
  - Real-migration rows render as today.
- `packages/web/src/app/routes/platform/setup/ai/model-migration/migrated-flows-dialog.tsx`:
  - Each migrated flow lists the existing "draft/published" sentence plus any of:
    - `"Piece upgraded {from} → {to}"` when `pieceVersionFrom !== pieceVersionTo`.
    - `"Image advanced options cleared"` when `changedFields.clearedAdvancedOptions`.
    - `"Web search disabled"` when `changedFields.disabledWebSearch`.
  - Flow name links to `/projects/{projectId}/flows/{flowId}` in a new tab (existing pattern).
- `packages/web/src/app/routes/platform/setup/ai/model-migration/failed-migrations-dialog.tsx`:
  - When `reason.code` is set, prefer a localized message (e.g. `"This flow is pinned to @activepieces/piece-ai@{currentPieceVersion}, which does not support {targetProvider}. Install @activepieces/piece-ai@{minRequiredPieceVersion} or later."`). Fall back to `error` string when `reason` is absent.

### 7. Tests
- Unit: `provider-support.test.ts` (piece, §2).
- Unit: `ai-piece-version-resolver.test.ts` — stub metadata service with varied installed-version sets; assert correct max-version selection and `null` when nothing fits.
- Unit: `ai-migration-planner.test.ts`:
  - (a) same piece version already supports target → no bump, no field changes.
  - (b) piece version incompatible → bumps to latest installed fit; no field changes.
  - (c) image migration → `advancedOptions` cleared; piece bump if needed.
  - (d) text migration, target supports web search → `webSearchOptions` rebuilt as `{ maxUses, includeSources }` (each conditionally present), all other source keys dropped.
  - (e) text migration, effective target is azure/custom/bedrock with `webSearch: true` → `webSearch` false, `webSearchOptions` cleared, `disabledWebSearch: true`.
  - (f) no compatible piece version installed → `blocked: NO_COMPATIBLE_PIECE_VERSION`.
  - (g) `runAgent` exercises the `AgentPieceProps.AI_PROVIDER_MODEL` path correctly.
  - (h) stale-schema flow version → schema chain runs first, then planner operates on latest-schema input.
  - (i) **CF-gateway/openai with webSearch: true** — effective provider resolves to OPENAI, flow lands in Clean (or Upgraded if piece version changed), `webSearch` stays `true`, `webSearchOptions` rebuilt keeping maxUses/includeSources. This pins the CF-parity assumption into the migration contract.
- Integration: [flow-ai-models-migration.test.ts](packages/server/api/test/integration/ce/flows/flow-ai-models-migration.test.ts) — end-to-end job covering (a), (b), (c), (e), (f), (i) for both `dryCheck: true` and `dryCheck: false`. Dry-check tests additionally assert that no new flow versions were written to the DB and `publishedVersionId` is unchanged after the job completes.

### 8. Rollout
- No DB migration — jsonb columns tolerate schema extension in Zod.
- No edition-specific behavior. Self-hosted CE/EE platforms with pinned piece catalogs see more "Blocked" entries with actionable messages.
- `@activepieces/shared` minor bump.

## Critical files

- [packages/shared/src/lib/management/ai-providers/piece-version-support.ts](packages/shared/src/lib/management/ai-providers/piece-version-support.ts) *(new)*
- [packages/shared/src/lib/automation/flows/dto/migrate-flow-model-request.ts](packages/shared/src/lib/automation/flows/dto/migrate-flow-model-request.ts)
- [packages/shared/src/lib/automation/flows/dto/flow-migration.ts](packages/shared/src/lib/automation/flows/dto/flow-migration.ts)
- [packages/server/api/src/app/flows/flow-version/ai-piece-version-resolver.ts](packages/server/api/src/app/flows/flow-version/ai-piece-version-resolver.ts) *(new)*
- [packages/server/api/src/app/flows/flow-version/ai-migration-planner.ts](packages/server/api/src/app/flows/flow-version/ai-migration-planner.ts) *(new)*
- [packages/server/api/src/app/flows/flow-version/flow-version-migration.service.ts](packages/server/api/src/app/flows/flow-version/flow-version-migration.service.ts)
- [packages/server/api/src/app/flows/flow-version/flow-migration.controller.ts](packages/server/api/src/app/flows/flow-version/flow-migration.controller.ts)
- [packages/pieces/community/ai/test/provider-support.test.ts](packages/pieces/community/ai/test/provider-support.test.ts) *(new)*
- [packages/web/src/features/platform-admin/api/ai-provider-api.ts](packages/web/src/features/platform-admin/api/ai-provider-api.ts)
- [packages/web/src/app/routes/platform/setup/ai/model-migration/migrate-flows-dialog.tsx](packages/web/src/app/routes/platform/setup/ai/model-migration/migrate-flows-dialog.tsx)
- [packages/web/src/app/routes/platform/setup/ai/model-migration/migrated-flows-dialog.tsx](packages/web/src/app/routes/platform/setup/ai/model-migration/migrated-flows-dialog.tsx)
- [packages/web/src/app/routes/platform/setup/ai/model-migration/failed-migrations-dialog.tsx](packages/web/src/app/routes/platform/setup/ai/model-migration/failed-migrations-dialog.tsx)
- [packages/server/api/test/integration/ce/flows/flow-ai-models-migration.test.ts](packages/server/api/test/integration/ce/flows/flow-ai-models-migration.test.ts)

## Verification

1. `cd /workspace && npm run lint-dev`.
2. Piece enforcement: add a `case` to `createAIModel` without touching `AI_PIECE_PROVIDER_SUPPORT` → `provider-support.test.ts` should fail.
3. Server unit: `nx test server-api --testFile ai-piece-version-resolver` and `ai-migration-planner`.
4. Server integration: `npm run test-api` — covers the planner cases for both `dryCheck: true` (no writes) and `dryCheck: false` (writes), plus schema-chain-first behavior against a stale-schema fixture.
5. **Smoke tests on the user's dev instance** (OpenAI + Cloudflare-gateway configured, server logs streamed in terminal). With CF parity merged, CF-gateway/openai is capability-equivalent to direct OpenAI, so the test matrix changes materially from the archived draft.

   **Test A — Happy-path dry-check + run for real (same-provider model swap)**
   - Build an `askAi` flow on OpenAI/gpt-4, `webSearch: false`. Publish.
   - Open Migrate, text mode, OpenAI/gpt-4 → OpenAI/gpt-4o. "Run a dry-check first" ticked. Click **Run migration**.
   - Expected: dry-check completes. Flow sits in **Upgraded** (piece bump to 0.3.7) with no Feature-adjusted entry. No writes yet — verify via server logs and version history.
   - Close dialog. On the table, click **Run for real** on the dry-check row.
   - Expected: confirm dialog with all fields disabled, no dry-check checkbox, banner visible.
   - Run migration. Server logs show a second job with `dryCheck: false`. Saved flow version has updated provider/model, bumped pieceVersion.

   **Test B — Cross-provider: OpenAI → CF-gateway/openai, webSearch on (parity test)**
   - Build `askAi` on OpenAI/gpt-4, `webSearch: true`, `webSearchOptions: { includeSources: true, searchContextSize: 'medium', maxUses: 5, userLocationCity: 'SF' }`. Publish.
   - Dry-check OpenAI → CF-gateway with submodel `openai/gpt-4o`.
   - Expected: flow lands in **Clean** or **Upgraded** — *not* Feature-adjusted. The planner resolves CF-gateway's `openai/gpt-4o` to effective provider OPENAI, which supports web search, so `disabledWebSearch` is false.
   - However: the `webSearchOptions` rebuild still runs. Inspect the dry-check's per-flow entry — it should show the rebuilt `{ includeSources: true, maxUses: 5 }`, with `searchContextSize` and `userLocationCity` dropped. Run for real; verify on the saved version.
   - **This test pins down that CF parity is honored end-to-end in the migration.**

   **Test C — Cross-provider: OpenAI → CF-gateway/anthropic, webSearch on**
   - Same source flow as Test B. Dry-check OpenAI → CF-gateway with submodel `anthropic/claude-sonnet-4-5`.
   - Expected: effective target provider is ANTHROPIC; web search is supported. Not Feature-adjusted. `webSearchOptions` rebuilt to `{ includeSources: true, maxUses: 5 }` (searchContextSize dropped because it's OpenAI-specific, userLocation dropped because we don't carry it).

   **Test D — Cross-provider: OpenAI → CF-gateway with unknown submodel, webSearch on (or Azure if configured)**
   - Pick a provider where the effective resolver can't map CF's prefix (or a truly non-web-search provider). If the dev instance doesn't expose one, synthesize by targeting an unrecognized submodel via dev console.
   - Expected: Feature-adjusted bucket with consequence "Web search will be disabled on this step". Saved flow has `webSearch: false`, empty `webSearchOptions`.

   **Test E — Image cross-model on OpenAI (advancedOptions cleared)**
   - Build `generateImage` on OpenAI/dall-e-3, `advancedOptions.quality = 'hd'`, `advancedOptions.size = '1792x1024'`. Publish.
   - Toggle "Migrate Image Models" in the dialog. Dry-check OpenAI/dall-e-3 → OpenAI/gpt-image-1.
   - Expected: Feature-adjusted with "Image advanced options cleared". Image-migration banner visible. Run for real — saved version has `advancedOptions: {}`.

   **Test F — Image migration through CF-gateway (parity test)**
   - Build `generateImage` on OpenAI/dall-e-3 with `advancedOptions.quality = 'hd'`. Publish.
   - Toggle "Migrate Image Models". Dry-check OpenAI/dall-e-3 → CF-gateway/openai/dall-e-3.
   - Expected: Feature-adjusted (advancedOptions always cleared on any image migration, even same-model). Run for real. Saved version has `advancedOptions: {}`, provider `cloudflare-gateway`, composite model `openai/dall-e-3`. If the dev instance runs the flow, CF should honour the default quality for dall-e-3 (standard).

   **Test G — "Migrate Image Models" checkbox filters providers**
   - Open dialog, toggle image mode. Provider dropdown should drop any provider with zero image models. OpenAI stays (dall-e-3 / gpt-image-1 / dall-e-2). CF-gateway's presence depends on whether `/v1/ai-providers/cloudflare-gateway/models` exposes image submodels.

   **Test H — Power-user mode (no dry-check)**
   - Uncheck "Run a dry-check first", submit. Single real migration record, no dry-check badge.

   **Test I — Dry-check record persistence on cancel**
   - Run dry-check. On table, click **Run for real**; on confirm dialog, Cancel.
   - Expected: dry-check row unchanged; **Run for real** still works on a subsequent click.

   **Test J — Modality mismatch rejected server-side**
   - Via dev console, post `/v1/flow-migrations` with `aiProviderModelType: AIProviderModelType.TEXT` but a `sourceModel.model` that's actually an image model.
   - Expected: 400 from the controller. Server logs confirm the pre-enqueue model-type lookup. No migration record created.

   **What the terminal logs will tell me during these runs**
   - Every BullMQ dispatch of `MIGRATE_FLOWS_MODEL` with the `dryCheck` flag visible on `data.request.dryCheck`.
   - Planner output per flow version — unexpected throws surface as stack traces.
   - Controller's modality-lookup errors.
   - `flowExecutionCache.invalidate` calls should NOT fire for dry-check runs.

   **Not reachable on this instance** (covered by unit/integration tests in §7): multi-installed-piece-version resolver, stale-schema-chain execution, bedrock Blocked (unless bedrock is available via BYOK on the dev instance).

## Risks and open questions

- **Manifest seeding accuracy.** Historical entries for `AI_PIECE_PROVIDER_SUPPORT` are hand-curated from the npm tarballs (empirically inspected across all 39 published versions). The CI test only guarantees correctness for the *current* version. Mistakes on historical entries could cause the planner to mis-categorize old-version flows. Mitigation: seed only at known transition points (0.0.1, 0.0.3, 0.0.4, 0.3.6) and rely on nearest-predecessor lookup.
- **Schema-chain persistence in dry-check.** The dry-check job calls `flowVersionMigrationService.migrate`, which persists schema-migration updates. That's acceptable — those migrations are idempotent and running them earlier than the real provider migration is always safe.
- **Dry-check duration on large platforms.** Runs as a job, so no HTTP timeout risk, but the user-visible wait could be long on platforms with many flow versions. UI shows an in-progress spinner. Future refinement: progressive updates from the worker every N flows for a live ticker.
- **CF passthrough for web search / image generation.** We assume Cloudflare AI Gateway transparently proxies OpenAI's `/v1/responses` with tool payloads and `/v1/images/generations` with quality/size params. Cloudflare's docs don't explicitly enumerate this, and one community report notes Google AI Studio image-gen failing through CF Gateway. If a real CF-gateway run fails in the live smoke tests, we'll scope the `disabledWebSearch` bucket to also include CF-gateway regardless of submodel (single-line change in the planner), and re-open the question on the piece side.
- **Removed providers.** xAI was added in an unmerged branch and removed before merge. No removed providers exist in main-branch history. The resolver naturally handles removals: versions `>= currentVersion` supporting the target are filtered; a removed-since-current provider has nothing that fits → Blocked.
- **Model-type metadata source.** The dialog learns a model's `AIProviderModelType` from the existing `/v1/ai-providers/{provider}/models` endpoint's `type` field. Server-side validation does the same lookup.

## Out of scope / follow-ups

- **Cross-provider field translation.** E.g. `allowedDomains` (Anthropic) → OpenAI equivalent. Intentionally not doing this — rebuild with maxUses + includeSources only and let the admin reconfigure if they care.
- **Rollback.** Per-entry `flowId` / pre-migration `flowVersionId` / post-migration `newFlowVersionId` / `draft` is enough for a future "revert this migration" button. For published rows, reset `publishedVersionId` to `flowVersionId`; for draft rows, reopen `flowVersionId` as the draft. Not in scope here.
- **Progressive dry-check updates.** Worker could flush partial results every N flows for a live-ticking UI.
- **Dry-check record retention / cleanup.** A periodic janitor to garbage-collect old dry-checks (e.g. > 30 days) is a natural follow-up.
- **OpenRouter composite-model parity.** CF-gateway parity is live; OpenRouter's composite model IDs (`openai/gpt-4`, `anthropic/claude-3.5`, …) go through the OpenRouter SDK on a different code path. Extending `getEffectiveProviderAndModel` to cover OpenRouter too is a separate, smaller PR.
