---
icon: 🧮
---

# Formulas

In-builder data transformation: users transform any text input using ~104 functions (text, number, date, list, logic) inserted via a `/` slash menu as TipTap badge nodes, with a live preview + type-check panel under the input.

### How it works
- Saved formulas persist inline in the input string via a versioned wrapper: `ap-formula-v1::{<expr>}::ap-formula-v1`, so they round-trip through serialization without colliding with plain text. Multiple formulas + plain text in one input concatenate; a single-formula input returns the raw typed value (preserves number/list/boolean).
- At runtime the engine's `props-resolver.ts` (~line 105) does a **pre-pass**: `formulaEvaluator.containsWrapper(input)` (matches `/ap-formula-v\d+::\{/`) routes the input through `preResolveFormulaVars` (dedup + resolve every `{{var}}` once via the same `resolveSingleToken` path as normal vars) then `formulaEvaluator.evaluate`.
- `preprocessExpression` pipeline: `replaceJsonArrays` → `preResolveVarsToPlaceholders` → `wrapStringArgs` (auto-quote args the registry expects as string) → `rewriteLazyIf` (`if(c;t;e)` → `(c)?(t):(e)` for short-circuit) → `normalizeExpression` (`;`→`,`, `and`/`or`/`not`→`&&`/`||`/`!`). Then `expr-eval`'s singleton `Parser` evaluates, with impls on `parser.functions.<name>`.

### Entities & files
- `core/shared/src/lib/formula/` — `formula-evaluator.ts`, `function-registry.ts` (`AP_FUNCTIONS`, the single source of truth), `function-implementations.ts`, `function-type-checker.ts`.
- Editor: `web/.../text-input-with-mentions/tiptap-editor.tsx` (always registers `FunctionSlashExtension` + the three inline atom badge nodes — no plan flag), search/hover popovers, `text-input-utils.ts` (doc ⇄ wrapped-string serializer). An `outputFormat: 'text' | 'html'` prop (default `'text'`) switches it into a rich-text WYSIWYG (StarterKit + toolbar) that serializes to/from HTML with mentions kept as `{{...}}` tokens; consumed by the `RICH_TEXT` property widget.

### Gotchas
- On **every** edition, unconditionally on — no plan flag or license toggle. The pre-pass runs regardless of any editor flag, so saved formulas keep evaluating even where the editor is off. Only embed difference: the search popover hides the external "See All" docs link.
- No new HTTP endpoints, no DB tables, no worker job — function metadata is bundled in `@activepieces/shared` and read directly by the frontend; evaluation is synchronous inside the engine.
- Evaluation failure throws `FormulaEvaluationError` (an `ExecutionError`), so the step fails with a structured message instead of crashing the engine.
- Type checker skips expression-operator args (e.g. `3 == 9`) to avoid false-positive errors on runtime-evaluated values.
- **`tokenizeExpression` tracks string literals, and that is what eats reference chips.** The serializer in `text-input-utils.ts` enters string mode on any `"`/`'` so a `)` or `;` inside a quoted function argument does not close the function node early. Added for formula args in 0.85.0 (#12444), it also swallowed `{{` — so `"{{step_4['result']}}"` re-parsed as raw text, and one unpaired quote earlier in a value killed every later chip in that field (GIT-1752). References are now emitted from inside the accumulation loop, and the string state is recomputed across the reference's interior. That recomputation is not optional: `concat("{{a"}}; lower(x))` puts the string-closing quote *inside* the reference, and skipping it leaves the following `;` inside the string and corrupts the value on re-save.
- **The builder's tokenizer and the runtime's are different code with different rules.** The engine uses `extractMustacheTokens` (`core/utils/src/lib/mustache-utils.ts`), which is brace-depth aware and completely quote-blind; the editor scans to the first `}}` and does track quotes. They agree on everything the UI can produce today, but a change to either is not automatically a change to the other — display and resolution can drift.
- **Three round-trip corruptions in that loop are known and unfixed**: a lone apostrophe in an unquoted formula argument, a newline inside function arguments, and an escaped backslash before a closing quote. They predate GIT-1752 and fail identically on older commits — don't treat them as a new regression when a round-trip test surfaces one.
- Backward-compat hooks: `argCompatibility.defaultArgs` (fill missing trailing args from a default) and `deprecated: { replacement, removeAfter }` (strikethrough badge, still resolves at runtime). Never hard-remove a function; format bumps are handled by the `v\d+` wrapper (add `evaluateV2`, dispatch on captured version).

### Key files
Entry point: `formulaEvaluator`, exported from `packages/core/formula/src/lib/formula-evaluator.ts` and imported by the engine's `props-resolver.ts` as `@activepieces/core-formula`.

- `packages/core/formula/src/lib/` — the whole formula library: evaluator + wrapper format, `AP_FUNCTIONS` registry, function implementations, type checker.
- `packages/server/engine/src/lib/variables/props-resolver.ts` — the runtime pre-pass that detects the wrapper and evaluates before normal `{{var}}` resolution.
- `packages/web/src/app/builder/piece-properties/text-input-with-mentions/` — the editor: `tiptap-editor.tsx`, `text-input-utils.ts` serializer, and `index.tsx` re-export.
- `packages/web/src/app/builder/piece-properties/text-input-with-mentions/extensions/` — the three inline atom badge nodes plus the `/` slash extension.
- `packages/web/src/app/builder/piece-properties/text-input-with-mentions/components/` — function search and hover popovers.
- `packages/core/shared/test/formula/` — evaluator, type-checker, and serializer round-trip tests.
- `packages/web/test/app/builder/piece-properties/text-input-with-mentions/` — serializer resilience and round-trip tests (unclosed `{{`, quoted references, quoted function args).

Paths verified 2026-07-17. An earlier version pointed at `packages/core/shared/src/lib/formula/`; it moved to its own package at `packages/core/formula/src/lib/` (`@activepieces/core-formula`).
