# Sensitive Output Redaction

## Summary
Lets a piece author mark specific action **output** fields as `sensitive` in the
action's `outputSchema`, so secrets returned by vault-style pieces (e.g. Amazon
Secrets Manager's Get Secret / Get Random Password) never appear in plain text in
run logs. The real value is kept in-process — downstream steps that reference the
field still receive it at runtime — and the engine redacts it to `**REDACTED**`
only at the log boundary: the persisted run-log file, the test-mode websocket
updates, and any downstream step's **logged (censored) input** that maps the field
in. This is the framework-level rule from issue #13706; the per-step manual
"secure input/output" toggle (Power Automate style) from that issue is out of scope.

## How it works
- `piece-executor` keeps the real `output` and records the resolved sensitive
  field paths on the step via `GenericStepOutput.sensitiveOutputFields`
  (`utils.sensitiveOutputFields(outputSchema)`).
- `output` stays real everywhere in the execution context, so `{{step.field}}`
  resolution is unaffected.
- A step that has sensitive fields is **never sliced** (kept inline in
  `upsertStep`) so the log boundary can still reach and redact the field.
- Redaction (`utils.redactFields(output, fields)`) is applied server-side at:
  - the **persisted run-log file** (`serialize` in `flow-run-progress-reporter.ts`), recursing into loop iterations — this is the record production runs and run-history views read;
  - the **censored** `currentState` in `flow-execution-context.ts`, which the
    `props-resolver` uses to build each step's `censoredInput` — closing the
    downstream logged-input leak.
- Single-step "Test Step" seeds prior steps from sample data via
  `test-execution-context.stateFromFlowVersion`, which re-loads each prior piece
  step's `outputSchema` (defensively) to re-attach `sensitiveOutputFields` — so a
  downstream step's censored input redacts the secret in single-step tests too,
  matching a full run.
- The engine does **not** redact the test-mode websocket step output. Those
  paths feed the builder's real-valued **sample-data** store, which single-step
  testing reads to resolve `{{step.field}}` across separate step-tests — redacting
  there would break builder step-chaining. See ADR for the trade-off.
- The **frontend** masks sensitive fields at display time only (real value stays
  in the store): `SmartOutputViewer` redacts the output panel + raw JSON + copy/
  download via `sensitiveOutputUtils.redactSensitiveOutput`; the data selector
  masks each sensitive field's inline preview in `buildFieldNode` (the inserted
  `{{ }}` mention path is unaffected, so it resolves to the real value at runtime).
- Only **top-level** output keys are redacted (resolved via `value` if set,
  otherwise `key`); nested/dot-path values are not.

## Key Files
- `packages/pieces/framework/src/lib/output-schema.ts` — the `sensitive?: boolean` field flag
- `packages/core/execution/src/lib/flow-run/execution/step-output.ts` — `GenericStepOutput.sensitiveOutputFields` + `setSensitiveOutputFields`
- `packages/server/engine/src/lib/utils.ts` — `sensitiveOutputFields()`, `redactFields()`, `REDACTED_VALUE`
- `packages/server/engine/src/lib/handler/piece-executor.ts` — records the field list at write time
- `packages/server/engine/src/lib/handler/context/flow-execution-context.ts` — slice guard + censored `currentState`
- `packages/server/engine/src/lib/variables/props-resolver.ts` — real vs censored resolution state
- `packages/server/engine/src/lib/helper/flow-run-progress-reporter.ts` — redacts the persisted run-log file
- `packages/web/src/components/custom/smart-output-viewer/redact-sensitive.ts` — frontend display-mask helper
- `packages/web/src/components/custom/smart-output-viewer/index.tsx` — masks the output panel / raw JSON / copy / download
- `packages/web/src/app/builder/data-selector/utils-schema.ts` — masks the data-selector inline preview
- `packages/pieces/community/amazon-secrets-manager/src/lib/actions/*` — first consumers
- `docs/build-pieces/piece-reference/output-schema.mdx` — piece-author docs

## Edition Availability
All editions (Community, Enterprise, Cloud) — engine-level behaviour, no plan gating.

## Known Limitations
- Only top-level output fields are redacted; nested/dot-path values are not.
- Applies to piece **action** outputs (via `outputSchema.sensitive`), not triggers.

## Domain Terms
- **Sensitive output field** — an action output key declared `sensitive` in `outputSchema`.
- **Redaction** / `**REDACTED**` — the placeholder written into logs in place of a sensitive value.
- **Censored input** — the log-only copy of a step's resolved input; secrets are blanked here too.
