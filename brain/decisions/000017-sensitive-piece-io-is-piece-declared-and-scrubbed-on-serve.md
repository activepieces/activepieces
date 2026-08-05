---
status: accepted
---

# Sensitive piece I/O is piece-declared and scrubbed on serve

## Decision

Piece authors declare sensitivity in the piece SDK: a new `sensitive: true` bit on `OutputSchemaField` (`packages/pieces/framework/src/lib/output-schema.ts`) for outputs, and the same bit on the base input property shape for inputs (`Property.ShortText({ sensitive: true })` and siblings). The engine keeps writing the raw step output and step input to `flow_run.steps.<name>.{output,input}` as today, plus computed `sensitive*Paths: string[]` alongside each, derived from the piece's declared schema. The run-details API endpoint scrubs those paths to `[REDACTED]` before serving to the browser. The engine's variable resolver and piece `run()` invocation read the raw blob directly, so a downstream `{{steps.get_secret.SecretString}}` in the HTTP piece resolves to the real value, and a piece action still receives its actual configured input. Sample data (per-step, persisted on the flow version, used by the data selector at design time) stores `[REDACTED]` outright for sensitive fields, since sample data is display-only and never consumed by the engine at run time. Input values remain **plaintext at rest** on the flow version row (`settings.input.<propName>`), not encrypted; the guarantee is scoped to run-log visibility, not to at-rest confidentiality.

## Context

Customer opened a ticket because the `Get Secret Value` action in `@activepieces/piece-amazon-secrets-manager` returns `SecretString` as plain JSON, which then shows in the run-details panel when a downstream step (typically the HTTP piece) uses it in an Authorization header. Generalises to any piece whose action legitimately returns a token, key, or PII, and symmetrically to any piece prop that takes a sensitive value directly (an API key typed inline, a PII field configured on the step).

The platform-native answer is already Secret Managers references (`{{connectionId|path}}`, see [secret-managers.md](../wiki/connections-auth/secret-managers.md)), which resolve the value just-in-time and never enter step I/O. That path solves the same problem more strongly but is EE/Cloud only and needs the vault reference to fit the customer's shape. Customers on CE, or with a secret path the reference syntax cannot express, still need a piece-native answer.

## Why

- **Piece-author-declared, not a user toggle.** The customer opened the ticket because the default was unsafe. A "hide" toggle at flow-design time means the same ticket recurs every time a new customer forgets to flip it. `Get Secret Value` unambiguously produces a secret and an API-key prop unambiguously takes one; the piece author is the right decider and every user of the piece gets the safe default with zero config, matching `.claude/rules/self-hosting.md`.
- **Scrub on serve, keep raw where it was.** Downstream steps and piece `run()` invocations must see the real value. Storing the raw and filtering at the API boundary is symmetric across inputs and outputs, adds one bit to the piece schema, and reuses the existing JsonViewer without teaching it a second value shape.
- **Not deep-vault storage.** Moving raw values off the run row or off the flow-version row into a Redis-cached vault (mirroring the Secret Managers path) solves a strictly stronger threat (DB dump, run-export API, flow export) at the cost of a whole new resolution mechanism, when Secret Managers references already solve exactly that stronger case. Customers whose threat model needs the stronger guarantee should route through a reference, not through a piece I/O flag.
- **Not encrypt-at-rest for inputs.** The person who typed a sensitive input into a step already had flow-edit access, so they still see it in the step-config panel; the leak this decision closes is a *teammate viewing the run* seeing it in the run-log display. If a customer needs teammate-level isolation on the flow-version row, the right fix is role-based flow-edit permissions or a Secret Managers reference, not per-prop encryption inside the flow version.
- **Not automatic detection.** `redactSecrets` in `packages/web/src/app/builder/data-display/explanation-prompt.ts` already regex-matches keys like `authorization|token|api_key` for the AI-explain-error prompt, but that heuristic is unreliable as a general contract: misses fields (`SecretString`), false-positives on user data, and gives no way for a piece author to be explicit.
- **Sample data as literal `[REDACTED]`, not raw + scrub.** Sample data is read only by the data selector at design time; the engine reads the previous step's actual output at run time, not sample data. So sample data does not need the raw copy, and dropping it removes one place the value can leak.

## Consequences

Piece authors gain a new one-bit contract on their input properties and on `OutputSchemaField`. Existing pieces get zero change until they opt in; `Get Secret Value` gets `sensitive: true` on its `SecretString` output field as the first adopter, and pieces whose props today accept tokens (Amazon Secrets Manager's `Create Secret` value field, for example) become the natural first callers on the input side.

The guarantee is **not visible in the UI run panel**, not **encrypted at rest**. On the output side the raw value still lives on `flow_run.steps.<name>.output`; on the input side it lives on both the run row (as configured input) and, more durably, on the flow version's step settings. A DB dump, a run-export API call, a flow export, or a platform admin with direct DB access still sees the real value. This is called out in customer-facing docs so the ceiling is honest, and Secret Managers references remain the recommendation whenever the customer's threat model reaches beyond casual over-the-shoulder viewing.

The two surfaces share one scrub layer in the run-details endpoint: one API code path, one `[REDACTED]` sentinel, one `sensitive: true` bit on the piece SDK. Adding user-side controls (a "hide this step's output" toggle, a per-project "always redact these keys" policy) is deliberately deferred; if a real case shows up that a piece cannot decide for itself (the HTTP piece returning an arbitrary JSON where only the user knows which field is secret), that becomes its own decision on top of this one.
