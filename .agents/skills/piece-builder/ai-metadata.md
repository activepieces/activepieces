# AI-Ready Metadata

Pieces power both human flow-builders and AI agents (via the MCP server and the agent tooling). Two **optional** fields let an action or trigger declare how it should appear to agents. Both are additive: omit them and the piece behaves exactly as before. Adding them never changes anything for human users.

| Field | Where | Shape |
|---|---|---|
| `audience` | actions only | `'human' \| 'ai' \| 'both'` |
| `aiMetadata` | actions **and** triggers | `{ description?: string; idempotent?: boolean }` |

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
| `'human'` | For human flow-builders only; kept off the agent surface. Use for actions that need human judgement or only make sense inside the visual builder. |
| `'ai'` | For AI agents only; kept out of the human catalog to reduce clutter. Use for agent-oriented atomics. |
| `'both'` | Useful to humans and agents alike. |
| *(omitted)* | Treated as `'both'` — available everywhere. This is the default; most actions need nothing here. |

Only set `audience` to deliberately fence an action to one surface. Leave it off otherwise.

---

## `aiMetadata` — describe the action for an LLM

```typescript
export const createRecordAction = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Creates a new record in My App',
  aiMetadata: {
    description:
      'Create a new record in My App. Use when the user wants to add an entry. Returns the created record id and fields.',
    idempotent: false,
  },
  props: { /* ... */ },
  async run(context) { /* ... */ },
});
```

**`description`** — written **for an agent**, not for the builder UI. The human `description` answers "what does this do" for someone reading a dropdown; `aiMetadata.description` answers "when should I call this tool, and what do I get back" for an agent choosing between hundreds of tools. Be explicit about intent, inputs, and the return shape. When the human `description` already reads well for an agent, omit this and the agent falls back to it.

**`idempotent`** — `true` when calling the action repeatedly with the same input is safe and yields the same result without extra side effects (a GET/lookup, or an upsert keyed on a stable id). `false` (or omitted) for actions that create or mutate on every call (`Send Message`, `Create Record`). Agents use this to reason about safe retries; it maps to the MCP `idempotentHint`.

---

## Triggers

Triggers take `aiMetadata` only — no `audience`:

```typescript
export const newRecordTrigger = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created',
  aiMetadata: {
    description: 'Fires when a new record is created in My App.',
  },
  // ... type, props, sampleData, run, onEnable, onDisable
});
```

`idempotent` is accepted for shape consistency but rarely meaningful on a trigger — leave it off.

---

## When to add this

- **Always fine to skip.** These fields are optional; an untagged piece keeps working exactly as before.
- Add `aiMetadata.description` to your most-used actions when the human description is terse or builder-specific — it is the single highest-value thing for agent usability.
- Set `idempotent: true` on read-only / lookup / upsert actions so agents can retry them safely.
- Reach for `audience` only when an action should be restricted to humans or to agents.
