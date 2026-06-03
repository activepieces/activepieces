# State: Store vs Tables vs Sheets, and idempotency

Steps already pass data forward via `{{stepN.field}}` — that's per-run scratch and needs no storage. Reach for real storage only when data must survive **between runs**, or be **queried/inspected**.

## Where should the state live?

| Need | Use | Why |
|---|---|---|
| Counter, dedup key, last-seen cursor, one value per entity | **Store** | Atomic key/value, fast, opaque |
| Scratch shared across steps within a single run | **Store**, scope `RUN` | Auto-cleaned after the run |
| Many rows of the same shape you'll query or inspect | **Tables** | Typed fields, filters, visible in the dashboard — see `ap_get_guide(tables)` |
| Data the user edits as a spreadsheet | **Google Sheets / Airtable / Notion** | The human owns the source of truth |
| A system of record that already exists | the external piece (HubSpot, Salesforce, Postgres…) | Don't duplicate state |

Rule of thumb: **Store** = "one value per key"; **Tables** = "many rows of the same shape".

## Store (`@activepieces/piece-store`)

Actions (`name` slugs): `get`, `put`, `append`, `add_to_list`, `remove_from_list`, `remove_value`.

- **`get` returns the raw stored value** (or the default you supply) — reference as `{{step_N}}`, not `{{step_N.value}}`.
- **Scope** (the value you pass → UI label): `COLLECTION` → "Project" (shared across all flows in the project; this is the default), `FLOW` → "Flow" (shared across runs of one flow), `RUN` → "Run" (one run only).
- Limits: **512 KB per value, 128-char key**. Hash long natural keys; move bigger/structured data to Tables.

## Idempotency — mandatory for retrying webhook triggers

Webhook providers (Stripe, Shopify, GitHub, Slack) deliver **at-least-once** and retry on timeout. Without a dedup gate you double-send, double-charge, double-write. **Make the gate the first step, before any side effect:**

```
trigger: webhook
step_1: store/get   key = "evt_{{trigger.body.<providerEventId>}}", scope = COLLECTION
step_2: ROUTER
   Branch:    DOES_NOT_EXIST {{step_1}}   → first time → proceed
   Otherwise:                             → duplicate → exit, do nothing
   (inside the proceed branch, FIRST store/put the key to mark it seen, THEN do the work)
```

Use the provider's **stable event id** (Stripe event id, GitHub delivery id, Slack `event_id`) — never your run id, a hash, or a timestamp.

**Alternative — dedup against the destination.** If the target is already a queryable Table/Sheet/CRM, skip Store: `ap_find_records` (or the piece's find action) to check whether the record exists, insert only if empty. This doubles as your audit trail. Common when the destination naturally holds the record anyway.

State drift is separate from dedup: an event you haven't seen before may still refer to a now-cancelled resource. When the underlying record can change, re-check its current state after the dedup gate.
