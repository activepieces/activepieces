# AI-Ready Metadata

Pieces power both human flow-builders and AI agents (via the MCP server and the agent tooling). Three fields declare how an action or trigger appears to agents and to flow-builders. They are additive — they change nothing about execution — and **new actions and triggers must ship with all of them**: a piece authored without them is a regression that has to be backfilled later.

| Field | Where | Shape | New code |
|---|---|---|---|
| `audience` | actions only | `'human' \| 'ai' \| 'both'` | **required, written explicitly** |
| `aiMetadata` | actions **and** triggers | `{ description?: string; idempotent?: boolean }` | **required** — `{ description, idempotent }` on actions, `{ description }` on triggers |
| `classification` | actions **and** triggers | `'READ' \| 'SEARCH' \| 'WRITE' \| 'DESTRUCTIVE'` | **required** — derived from `run()`; triggers are always `'READ'` |

All three are plain values on the `createAction` / `createTrigger` object — no import is needed. Triggers accept `aiMetadata` and `classification` but **not** `audience`: a trigger is an event, not an agent-callable operation.

---

## `audience` — who the action is for

```typescript
export const createRecordAction = createAction({
  name: 'create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record in My App',   // human-facing
  audience: 'both',                                // 'human' | 'ai' | 'both'
  props: { /* ... */ },
  async run(context) { /* ... */ },
});
```

| Value | Meaning |
|---|---|
| `'human'` | For human flow-builders only; kept off the agent surface. Use for raw-LLM/ask-AI wrappers (the agent is already an LLM), generic data transforms and flow control the agent does natively, and actions that only make sense inside the visual builder. |
| `'ai'` | For AI agents only; kept out of the human catalog to reduce clutter. Use for agent-oriented atomics. |
| `'both'` | Useful to humans and agents alike — the right value for almost every real integration action. |

**Write the value explicitly — do not omit it.** Piece metadata is serialized from the raw action objects with no default injection, so downstream filters only see `audience` when it is physically present in the file. For a normal integration action, write `audience: 'both'`.

`custom_api_call` is already handled: the shared `createCustomApiCallAction` factory sets `audience: 'human'` internally (a raw HTTP escape hatch is not an agent tool). Only a hand-rolled `createAction({ name: 'custom_api_call', ... })` needs its own `audience` like any other action.

---

## `aiMetadata` — describe the action for an LLM

```typescript
export const createRecordAction = createAction({
  name: 'create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record in My App',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new record in My App. Use to add a single entry when you already have its field values; for bulk inserts prefer the batch action. Each call creates a new record, so retries duplicate.',
    idempotent: false,
  },
  props: { /* ... */ },
  async run(context) { /* ... */ },
});
```

### Writing `aiMetadata.description`

It is written **for an agent choosing between hundreds of tools**, not for the builder UI. The human `description` answers "what does this do" in a dropdown; the agent description answers "when should I pick this one". 1–3 sentences:

1. **What it does** — without echoing the human description verbatim.
2. **When to pick it** over neighboring actions — name the materially different sibling or mode if one exists ("for bulk inserts prefer X", "use Y to search by email instead").
3. **The key constraint** — required pairings, limits, side effects — and the retry behavior in prose ("safe to retry", "each call creates a new record").

Keep it to the choose-me guidance — return shapes belong in output contracts (a separate feature), examples belong elsewhere, and padding costs agent context. Shorter wins.

### Deriving `idempotent`

Read the `run()` body and decide from what the API call actually does — not from the action's name:

| `run()` does | `idempotent` |
|---|---|
| GET / list / search / lookup | `true` |
| Upsert keyed on a caller-supplied stable id | `true` |
| Update of a specific record to a given state (PATCH/PUT by id) | `true` |
| Create / send / append / enqueue (new entity per call) | `false` |
| Delete (a retry typically 404s or errors) | `false` |
| Multi-step mutations (e.g. copy-then-delete "move") | `false` — a partial retry duplicates or errors |

Agents use this to reason about safe retries; it maps to the MCP `idempotentHint`.

---

## `classification` — what the step does to external state

Renders as a badge in the builder's piece selector (`READ`/`SEARCH`/`WRITE` as quiet grey pills, `DESTRUCTIVE` in red) and is the declared read/write signal for future consumers. Convention: place it right after `name:` in the config object.

Classify from the `run()` body and the API call it makes — the name and description are hints, never evidence. **Precedence, first match wins:**

| Value | Means | Typical verbs |
|---|---|---|
| `DESTRUCTIVE` | removes or disables external state; a retry cannot restore it | delete, purge, revoke, cancel, archive, stop/teardown of a subscription or watch |
| `WRITE` | creates or changes external state, recoverably | create, send, post, update, upsert, move, assign, tag |
| `SEARCH` | reads by query or enumeration, zero-or-more results, no mutation | list, search, find, query |
| `READ` | reads a specific known resource or fixed state | get, retrieve, describe, download |

Rules that settle the recurring edge cases:

- **All triggers → `'READ'`**, polling and webhook alike. The badge answers "does this step change anything?"; the READ/SEARCH split is about how you address data (by id vs by query), which is meaningless for an event you did not ask for.
- **Sending is `WRITE`, not `DESTRUCTIVE`** — a sent email/message adds state, it doesn't destroy any.
- **AI/LLM inference or generation** that persists no artifact to an external system → `READ`. "Generate and upload/store" → `WRITE`.
- **Pure in-flow transforms** (text/math/date/json/csv/crypto helpers) → `READ`.
- **Key-value store style pieces**: get → `READ`, put/append → `WRITE`, delete → `DESTRUCTIVE`.
- **One action, multiple operations** (an `operation` prop that can read *or* delete) → tag the worst case reachable.
- **Arbitrary-operation actions** (raw SQL, raw HTTP, caller-supplied method) → `WRITE`. Factory-built actions (`createCustomApiCallAction`) are tagged at the factory level, not per piece.

---

## Triggers

Triggers take `aiMetadata` with `description` only — no `audience`, no `idempotent` — plus `classification: 'READ'` (always, see above):

```typescript
export const newRecordTrigger = createTrigger({
  name: 'new_record',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Triggers when a new record is created',
  aiMetadata: {
    description: 'Fires when a new record is created in My App, once per record.',
  },
  // ... type, props, sampleData, run, onEnable, onDisable
});
```

Describe **when the event fires and what one payload represents** (per record? per batch? on update too?).

---

## Factory-built actions and triggers

If actions/triggers are produced by a shared factory (a helper that wraps `createAction`/`createTrigger`), the factory's params type must declare `audience`/`aiMetadata`/`classification` and forward them into the wrapped call — otherwise the fields in your config objects silently fail to compile or never reach the framework. Add the fields to the factory's param type and pass them through.

---

## When to add this

- **New actions and triggers: always.** `audience: 'both'` + `aiMetadata { description, idempotent }` + `classification` on every action; `aiMetadata { description }` + `classification: 'READ'` on every trigger.
- Set `audience: 'human'` instead when the action is an ask-an-LLM wrapper, a generic transform, or otherwise meaningless as an agent tool.
- Touching an existing untagged action anyway? Tag it while you're there.
