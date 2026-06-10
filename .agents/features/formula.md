# Formulas (Data Manipulation)

## Summary
Formulas let users transform input values inside any text input in the flow builder using 81 functions across text, number, date, list, and logic categories. The editor exposes a `/` slash trigger that inserts functions as TipTap badge nodes; a live preview panel under the input shows the evaluated result and type-check errors. Saved formulas are persisted in the input string using a versioned wrapper `ap-formula-v1::{<expression>}::ap-formula-v1` so they round-trip through serialization without colliding with plain text. At runtime the engine's `props-resolver` detects the wrapper and routes the input through `formulaEvaluator.evaluate`, which pre-resolves variable mentions, normalizes the expression (semicolon-to-comma, `and/or/not` rewrite, lazy `if`, bare-string quoting), and hands it to the `expr-eval` parser whose `parser.functions.*` namespace holds the JS implementations.

## Key Files

### Shared formula library (`packages/shared/src/lib/formula/`)
- `formula-evaluator.ts` — wrapper format, tokenizer, `evaluate`, `containsWrapper`, `wrap`, `unwrap`; preprocess pipeline (`preprocessExpression` at line 78): `replaceJsonArrays` → `preResolveVarsToPlaceholders` → `wrapStringArgs` → `rewriteLazyIf` → `normalizeExpression`.
- `function-registry.ts` — 81-entry array `AP_FUNCTIONS` and the `ApFunction` type (with optional `deprecated`, `argCompatibility` extension points).
- `function-implementations.ts` — wires each registry entry to `parser.functions.<name>` on a module-private `Parser` instance.
- `function-type-checker.ts` — `typeCheckTiptapDoc()` runs against the editor doc; reports arg-count and type-mismatch errors keyed by function-start node id. Expression-operator args (e.g. `3 == 9`) are skipped (line 219) so runtime-evaluated values don't get false-positive type errors.

### Editor UI (`packages/web/src/app/builder/piece-properties/text-input-with-mentions/`)
- `index.tsx` — 14-line wrapper, just re-exports `TiptapEditor`.
- `tiptap-editor.tsx` — main editor (747 LOC): editor gate at line 127 (`formulaEnabled = platform.plan.dataManipulationEnabled && !embedState.isEmbedded`) — requires both the plan flag **and** a non-embedded builder, conditional slash-extension registration, live preview, type-checker integration, variable mentions integration.
- `extensions/bracket-nodes.tsx` — three TipTap inline atom nodes (`function_start`, `function_sep`, `function_end`) rendered as badges. **Always registered**, even when the flag is off, so saved formulas display read-only.
- `extensions/function-slash-extension.ts` — ProseMirror plugin that watches for `/`, opens the search popover, inserts at the cursor.
- `components/function-search-popover.tsx` — filter-as-you-type list backed by `AP_FUNCTIONS`.
- `components/function-hover-popover.tsx` — per-badge tooltip with signature, description, example, deprecation marker.
- `text-input-utils.ts` — tokenizer + serializer: TipTap doc ⇄ wrapped string. Recognizes `{{step.x}}` and `{{variables.x}}` mentions inside formula args. An unclosed `{{` (mid-typing state) is emitted as literal text so the tokenizer always makes forward progress.

### Engine wiring (`packages/server/engine/src/lib/variables/`)
- `props-resolver.ts:105` — formula pre-pass. Before any other resolution, `resolveInputAsync` checks `formulaEvaluator.containsWrapper(input)`; if true it calls `preResolveFormulaVars` (lines 272–299) to dedup and resolve every `{{var}}` once, then `formulaEvaluator.evaluate({ expression, sampleData })`. **Unconditional** — runs regardless of the plan flag, so saved formulas keep evaluating even on platforms that have the editor flag off.
- `preResolveFormulaVars` — extracts unique `{{...}}` tokens, resolves each via `resolveSingleToken` (the same path documented in `variables.md`), batches with `Promise.all`, returns `{ expression, vars }` for the evaluator.

### Feature flag & licensing
- `packages/shared/src/lib/management/platform/platform.model.ts` — `dataManipulationEnabled: z.boolean()` on the plan zod schema.
- `packages/server/api/src/app/ee/platform/platform-plan/platform-plan.entity.ts` — `dataManipulationEnabled` column on `platform_plan`.
- `packages/server/api/src/app/database/migration/postgres/1794000000000-AddDataManipulationEnabledToPlatformPlan.ts` — migration: nullable add → backfill `false` → set `NOT NULL`.
- `packages/shared/src/lib/core/license-keys/index.ts:37` — `dataManipulationEnabled: z.boolean().optional()` on `LicenseKeyEntity`.
- `packages/server/api/src/app/ee/license-keys/license-keys-service.ts:164` — `applyLimits` writes `key.dataManipulationEnabled ?? false` onto the platform plan; `turnedOffFeatures` resets to `false` on expiry.
- `packages/shared/src/lib/ee/billing/index.ts` — default `false` in both `FREEMIUM_PLAN` (line 85) and `OPEN_SOURCE_PLAN` (line 112).

### Tests (`packages/shared/test/formula/`)
- `function-evaluator.test.ts` — 161 tests, one+ per function plus pipeline cases (lazy if, var dedup, wrapper detection, embedded formulas in strings).
- `type-checker.test.ts` — 13 tests for arg-count, type-mismatch, expression-arg skip.
- `serializer-roundtrip.test.ts` — 22 tests for TipTap doc ⇄ wrapped-string round-trips.

### Web-side (`packages/web/test/app/builder/piece-properties/text-input-with-mentions/`)
- `text-input-utils.test.ts` — unclosed-`{{` resilience (previously caused an infinite loop / tab freeze), literal-text fallback rendering, and complete `{{...}}` mention-node creation via `convertTextToTipTapJsonContent`.

## Edition Availability
- Community (CE): available when `platform.plan.dataManipulationEnabled` is true (defaults to `false` on `OPEN_SOURCE_PLAN`).
- Enterprise (EE): available when `platform.plan.dataManipulationEnabled` is true (default `false`; toggled per platform via license key).
- Cloud: available when `platform.plan.dataManipulationEnabled` is true (default `false` on `FREEMIUM_PLAN`; toggled per platform via license key).
- Embedded builder: **never available**, regardless of the plan flag — the editor gate also requires `!embedState.isEmbedded`.

**The engine path is not gated.** The editor gate (plan flag + non-embedded) only affects the editor UI: slash trigger, popovers, type checker, and slash insertion. Bracket nodes always render so saved formulas display read-only even when the gate is off. Existing saved formulas continue to evaluate regardless of the gate's current value.

## Domain Terms
- **Formula** — a function-based expression inserted into a text input that transforms data at runtime.
- **Wrapper** — `ap-formula-v1::{<expression>}::ap-formula-v1`. Versioned (`v\d+`) so future format changes can coexist with v1 data in saved flows.
- **Function badge** — the visual representation of a function call in the editor: a `function_start` node + arg slots + `function_sep` nodes + `function_end` node. Stored as three TipTap inline atoms with a shared `openId` attribute linking start/sep/end.
- **Slash trigger** — typing `/` inside a text input opens the function search popover.
- **Preview panel** — the box under the input showing the live evaluated result while editing, or the type-check error message when the expression is invalid.
- **Type checker** — `typeCheckTiptapDoc()` walks the editor doc and reports arg-count or type errors per function node; rendered as red highlights and tooltips on the badge.
- **Registry** — the `AP_FUNCTIONS` array; the single source of truth for function names, signatures, descriptions, examples, arg types, return types, and deprecation status.
- **Pre-pass** — the `containsWrapper` check at `props-resolver.ts:105` that routes wrapped inputs through `formulaEvaluator.evaluate` before regular variable resolution.
- **Argument compatibility** — `argCompatibility.defaultArgs` on a registry entry; the runtime fills missing trailing args from this default so adding a new arg doesn't break saved flows. (Hook in place; not yet exercised by any function.)
- **Deprecated marker** — `deprecated: { replacement?, removeAfter }` on a registry entry; the editor shows a strikethrough badge with the suggested replacement; runtime still resolves.

## Wrapper Format

Saved values look like:
```
Hello ap-formula-v1::{uppercase({{trigger.name}})}::ap-formula-v1, welcome!
```

- `containsWrapper(input)` matches `/ap-formula-v\d+::\{/`.
- `evaluate` tokenizes the string into a sequence of `text` and `formula` segments and walks them. Multiple formulas plus plain text in one input are supported; the result is the concatenated string (each formula result stringified).
- Single-formula inputs (one segment, no surrounding text) return the raw evaluated value — preserves number/list/boolean types rather than stringifying.

## Evaluator Pipeline

`preprocessExpression(expr, sampleData)` runs in order:

1. **`replaceJsonArrays`** — captures inline JSON arrays (`[{...}]`) and replaces them with `__ap_v1__` placeholders so later transforms don't choke on commas inside JSON.
2. **`preResolveVarsToPlaceholders`** — every distinct `{{var}}` mention becomes a `__ap_v0__` placeholder; `vars[placeholder]` holds the resolved value. Dedup ensures `{{x}}` referenced twice resolves once.
3. **`wrapStringArgs`** — for every recognized `AP_FUNCTIONS` call, inspects each arg's expected type from the registry; if the slot expects `'string'` (or a union including string) and the arg isn't already quoted / a function call / a placeholder, wraps it in `"..."`. Recurses into nested calls.
4. **`rewriteLazyIf`** — converts `if(cond; then; else)` into `(cond) ? (then) : (else)` so branches short-circuit (expr-eval doesn't have lazy evaluation; the untaken branch would otherwise execute and could throw e.g. divide-by-zero).
5. **`normalizeExpression`** — outside of string literals: `;` → `,`; bare `and` / `or` / `not` keywords → `&&` / `||` / `!`.

The expression is then parsed and evaluated by `expr-eval`'s singleton `Parser` whose `parser.functions.<name>` namespace is populated by `function-implementations.ts`. The implementations call back into placeholders (`__ap_v0__`/`__ap_v1__`) via the `vars` map passed as `sampleData` — so resolved variables and inline JSON are first-class values to the function bodies.

## Engine Resolution (formula pre-pass)

`packages/server/engine/src/lib/variables/props-resolver.ts:102–113`:

```
async function resolveInputAsync(params) {
    if (formulaEvaluator.containsWrapper(input)) {
        const { expression, vars } = await preResolveFormulaVars({ expression: input, resolveOptions })
        const { result, error } = formulaEvaluator.evaluate({ expression, sampleData: vars })
        if (error) throw new FormulaEvaluationError({ expression: input, message: error })
        return result ?? ''
    }
    // ...regular {{var}} resolution path...
}
```

The pre-pass:
- Reuses the existing `resolveSingleToken` for every `{{var}}` inside the formula — so connections, step references, and variable mentions all resolve via the same code documented in `variables.md`, `app-connections.md`, etc.
- Throws `FormulaEvaluationError` (an `ExecutionError` subclass) on evaluation failure, so the step fails with a structured message rather than the engine crashing.
- Is **unconditional** with respect to the plan flag — the engine has no view of `platform.plan.dataManipulationEnabled`. This is intentional so that disabling the flag mid-flow doesn't break flows already saved with formulas.

## Editor Composition

`tiptap-editor.tsx`:
- Reads `platform.plan.dataManipulationEnabled` via `platformHooks.useCurrentPlatform()` and `embedState.isEmbedded` via `useEmbedding()`; `formulaEnabled` is the AND of (flag true) and (not embedded).
- `getExtensions({ formulaEnabled })` always includes `FunctionStartNode`, `FunctionEndNode`, `FunctionArgSeparatorNode` (so existing formulas render as badges no matter the flag); conditionally includes `FunctionSlashExtension` only when `formulaEnabled` is true.
- Holds slash-state, active-function-info, focus, type-errors, preview-result in component state. `typeCheckTiptapDoc(doc)` runs on doc updates; errors map to badge highlights and the preview panel.
- Variables integration: fetches the project's variables via `variablesQueries.useVariables(...)` and threads the `name → name` map into `createMentionNodeFromText` and `convertTextToTipTapJsonContent` so variable mentions render with their display name.

## Exit Strategies

Documented in `.claude/plans/glimmering-percolating-unicorn.md`. Summary:
- **Function impl change** — versioning policy: bump `@activepieces/shared` minor + changelog entry.
- **Arg added/removed** — use `argCompatibility.defaultArgs` so old flows fill the missing arg from a default; mark old shape `deprecated` if behavior diverges.
- **Function removed** — never hard-remove; mark `deprecated: { replacement, removeAfter }` for at least one minor cycle; editor shows strikethrough badge with replacement suggestion.
- **Feature dropped** — keep the engine pre-pass unconditional; flag only gates editor UI. Hard removal needs a one-shot migration that unwraps every `ap-formula-v1::{...}` in stored flows.
- **Format change `v1` → `v2`** — `containsWrapper` already matches `v\d+`; add `evaluateV2` and dispatch on the captured version.

## Frontend Hooks
- `platformHooks.useCurrentPlatform()` — provides `platform.plan.dataManipulationEnabled` for the editor gate.
- `useEmbedding()` (`@/components/providers/embed-provider`) — provides `embedState.isEmbedded`; the editor gate ANDs `!isEmbedded` with the plan flag, so the formula UI never shows in an embedded builder.
- `variablesQueries.useVariables(...)` — fetches the project's variables (see `variables.md`); used by the editor to render variable mention labels inside formula args.

## What's NOT in this feature
- No new HTTP endpoints. Function metadata is bundled in `@activepieces/shared` and read directly by the frontend; no `/v1/formulas/*` route exists.
- No DB tables for the formula content itself — formulas are inline in the step's existing input fields, persisted with the rest of the flow version JSON.
- No worker job — evaluation is synchronous inside the engine's `resolveInputAsync`.
