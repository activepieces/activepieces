# Sensitive-output redaction redacts the persisted run log, but only masks the builder display — sample data stays real

## Status

accepted

## Context

A piece action can mark output fields `sensitive` in its `outputSchema` (issue
#13706) so secrets returned by vault-style pieces don't leak in run logs. The
real value must still reach downstream steps at runtime — so the engine keeps
`output` real in the execution context and redacts only at the log boundary.

That works for production runs (steps chain in one in-memory execution) and for
the persisted run-log file. But the flow **builder** does not chain steps in one
execution. "Test Step" on step 2 does **not** re-run step 1; it seeds
`{{step_1.output.apiKey}}` from a separate **sample-data store** (the `file`
table, `FileType.SAMPLE_DATA`), and that store is populated from the step output
the engine sends over the **test-mode websocket** (`run-state.ts` →
`updateSampleData`). Redacting the websocket output — the first implementation —
poisoned the sample-data store: step 1's saved sample became `**REDACTED**`, and
testing step 2 resolved the placeholder instead of the secret.

The fundamental constraint: builder step-chaining requires the **real** value in
a store the next step-test can read. Any redaction of that store breaks chaining.

## Decision

- **Redact the persisted run-log file** (and the censored downstream input) —
  this is the record production runs and run-history views read, and the target
  the issue names.
- **Do not redact the test-mode websocket step output.** It feeds the real-valued
  sample-data store that single-step testing depends on; it stays real.
- **Mask sensitive fields in the builder at display time only.** The frontend
  redacts the output panel, raw-JSON tab, copy/download (`SmartOutputViewer`) and
  the data-selector inline preview (`buildFieldNode`) using the action's
  `outputSchema`. The stored value stays real, so the inserted `{{ }}` mention
  resolves to the real secret at runtime.

## Consequences

- **The real secret is persisted in plaintext in the sample-data `file` row.**
  Frontend masking is display-only; it is not storage redaction. This is
  unavoidable if builder step-chaining must work. It is acceptable because sample
  data is design-time data authored by someone who already holds the secret, and
  because the persisted run log (the surface the issue targets, and the only
  record for production runs) *is* redacted.
- Redaction logic is duplicated across layers by necessity: engine
  (`utils.redactFields`) for the run log, frontend
  (`sensitiveOutputUtils.redactSensitiveOutput` + the data-selector guard) for the
  builder display. They must agree on "top-level keys, `value ?? key`".
- Masking the display is a per-surface concern: any *new* place that renders raw
  step output/sample data must apply the mask itself. The two shared choke points
  (`SmartOutputViewer`, `buildFieldNode`) cover today's surfaces.

## Considered and rejected

- **Redact the websocket output too.** Simplest engine change, secure on every
  surface — but breaks builder step-chaining (the reported symptom). Rejected.
- **Redact the sample-data store.** Same breakage: downstream step-tests would
  read the placeholder. Rejected.
