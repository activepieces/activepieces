# AI-Ready Metadata

Pieces power both human flow-builders and AI agents (via the MCP server and the agent tooling). Two fields declare how an action or trigger appears to agents. They are additive — they change nothing for human users — but the catalog is now fully curated (every existing action carries them), so **new actions and triggers must ship with them**: a piece authored without AI metadata is a regression that has to be backfilled later.

| Field | Where | Shape | New code |
|---|---|---|---|
| `audience` | actions only | `'human' \| 'ai' \| 'both'` | **required, written explicitly** |
| `aiMetadata` | actions **and** triggers | `{ description?: string; idempotent?: boolean }` | **required** — `{ description, idempotent }` on actions, `{ description }` on triggers |

Both are plain values on the `createAction` / `createTrigger` object — no import is needed. Triggers accept `aiMetadata` but **not** `audience`: a trigger is an event, not an agent-callable operation.

---

## `audience` — who the action is for

```typescript
export const createRecordAction = createAction({
  name: 'create_record',
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

Do **not** describe the return shape (output contracts are a separate feature), do not embed worked examples, and do not pad — shorter wins for agent context.

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

## Triggers

Triggers take `aiMetadata` with `description` only — no `audience`, no `idempotent`:

```typescript
export const newRecordTrigger = createTrigger({
  name: 'new_record',
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

If actions/triggers are produced by a shared factory (a helper that wraps `createAction`/`createTrigger`), the factory's params type must declare `audience`/`aiMetadata` and forward them into the wrapped call — otherwise the fields in your config objects silently fail to compile or never reach the framework. Add the fields to the factory's param type and pass them through.

---

## When to add this

- **New actions and triggers: always.** `audience: 'both'` + `aiMetadata { description, idempotent }` on every action, `aiMetadata { description }` on every trigger.
- Set `audience: 'human'` instead when the action is an ask-an-LLM wrapper, a generic transform, or otherwise meaningless as an agent tool.
- Touching an existing untagged action anyway? Tag it while you're there.
