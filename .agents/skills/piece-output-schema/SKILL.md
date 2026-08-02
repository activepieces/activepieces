---
name: piece-output-schema
description: Generate and wire `outputSchema` for an Activepieces piece's actions and triggers. Use when the user asks to add output schemas to a piece, curate a step's output for the data selector / output viewer, or improve how a piece's step output appears in the builder. Captures each step's REAL output against a live connection, curates the useful fields, and writes typed, labelled schemas.
---

# Piece Output Schema Generator

An `outputSchema` turns a step's raw JSON output into a **friendly, typed, labelled tree** in the flow builder's data selector and output viewer — and a **path map** that LLM/MCP consumers use to find the fields that matter. This skill takes a piece from "raw JSON dump" to curated schemas across all its actions and triggers.

Reference: the merged 15-piece PR is [activepieces#13757](https://github.com/activepieces/activepieces/pull/13757). Look at any of those pieces' `src/lib/output-schemas.ts` for a finished example (ClickUp is the richest; `google-docs` and `google-calendar` are readable smaller ones).

## The mental model (read this first)

An `outputSchema` is **a curated tree**: at every level you describe, only the fields you list appear — their siblings are dropped. That is exactly how you keep the output clean.

- **Omitting a field hides it.** At the top level, only the fields in `schema.fields` render; undescribed root siblings are gone. Inside a described object (`children`) or array item (`listItems`), only the children you list render — the resolved value's other keys are dropped.
- **One exception — an *undescribed* container is fully drilled, not hidden.** If you *name* a field but do **not** describe its inner shape (no `children`/`listItems`), the renderer drills the whole value generically (matrices → Row/Cell, arrays → list, objects → every key) instead of dead-ending. So you either describe a container's useful inner fields **or** leave the field off entirely — you cannot name a container and show only *some* of its contents without listing them.
- What the schema therefore does: (1) **curate** — list the fields worth surfacing, drop the rest; (2) **label** them for humans; (3) attach **formats** (`datetime`, `url`, `email`, …) so values render nicely; (4) record **paths** so the data selector and AI/MCP consumers can find the important fields.
- Practically: **describe the fields a user actually needs**, describe the important nested/deep ones, apply formats and labels, and leave the API's internal noise (config, headers, tokens, opaque bookkeeping ids) off the list.

Because the schema describes **what the action's `run()` returns** (not the raw third-party API response), you must know the return shape before you can map paths. See [capture-recipes.md](./capture-recipes.md).

## Prerequisites

1. A **running local dev instance** (`npm start` / `npm run dev`). Dev pieces load from each piece's built `dist/` — see [capture-recipes.md](./capture-recipes.md#dev-piece-reload) if a piece doesn't appear.
2. A **real, active connection** for the target piece (the user provides credentials — OAuth sign-in, API key, etc.). Prefer running steps through the piece (Test Step) so the engine handles token refresh; raw API calls with a stale OAuth token will 401.
3. If the piece isn't already loaded as a dev piece, add its folder name to `AP_DEV_PIECES`.

**Ask the user** for: which piece(s), and the connection/credentials to use, before starting.

## Workflow

### Step 1 — Scope the piece
List the piece's actions and triggers (`packages/pieces/community/<piece>/src/lib/{actions,triggers}`). For each, decide whether it gets a schema using the table below.

| Step kind | Schema? |
|---|---|
| Create / Update / Get / Read / List / Search / Find | **Yes** |
| Delete / clear / archive that returns an empty body (`{}`, `''`, `204`) | **No** — nothing to describe |
| `custom_api_call` (generic passthrough) | **No** |
| Polymorphic trigger (payload is message OR poll OR callback, etc.) | **No** — a single shape would mislabel the others (e.g. Telegram "New Update") |
| Webhook / polling trigger with a stable payload | **Yes** — describes ONE item (the per-run payload) |

### Step 2 — Learn each step's return shape
Open the action/trigger's `run()` (and `test()` for triggers). Note whether it returns `response.body`, `response.data`, the **full HTTP/Gaxios wrapper** (`{status, headers, body, config}`), or a hand-built/transformed object. **Never surface `config` or `headers`** — `config.headers.Authorization` leaks the bearer token. The schema's top-level `value` paths are relative to this returned object.

### Step 3 — Capture the REAL output
Run each step against the live connection and capture the exact output JSON. Full recipes in [capture-recipes.md](./capture-recipes.md). In short:
- **Preferred:** builder **Test Step** (UI, or drive it with the browser MCP), or the `POST /v1/sample-data/test-step` API once a flow with the step exists. This runs the piece's own code — faithful output, and the engine refreshes OAuth tokens for you.
- **Empty READ → WRITE first:** if a list/search/get returns empty because there's no data, run the corresponding **create/write** action first to seed data (chain the new id into the read's input), then re-run the read. This is a core part of the job — do not author a list schema from an empty `[]`.

### Step 4 — Curate and author the schema
Write the schema in `packages/pieces/community/<piece>/src/lib/output-schemas.ts` (create the file if absent). Full field reference, formats, labels, and wiring in [schema-reference.md](./schema-reference.md). The essentials:
- Keep only **useful** fields; drop config/headers/tokens and opaque bookkeeping.
- A field's `value` (the path) is **optional and defaults to `key`**. For a plain field, set `key` to the real JSON property name and **omit `value`** (the dominant shipped style); set `value` only to unwrap (`body.*`, `data.*`) or rename. See [key vs value](./schema-reference.md#key-vs-value).
- Apply a **`format`** to every field where one fits (`datetime`, `url`, `email`, `boolean`, `image`, `filesize`, `html`, `number`, `date`, `currency`, `duration`).
- **`children` / `listItems` paths are RELATIVE to the parent's value** — this is the #1 correctness bug. `owners[].displayName` is described as a top-level field `owners` with a `listItems` child `{ key: 'displayName' }`, NOT a child path of `owners.displayName`.
- **Top-level array output** → one wrapper field with `value: ''` + `listItems`, plus a schema-level `itemLabel` template (e.g. `'Row {row}'`).
- **Maps with opaque/variable keys** (e.g. per-calendar busy times) → `dynamicKey: true`.
- Add **`labelKey`** to lists/maps so items show a meaningful label; **`itemLabel`** for top-level arrays.
- **Reuse shared field-sets** — factor a repeated object shape (e.g. `taskFields`, a Drive `fileFields`) into a `const` and reference it from every action/trigger that returns it.

### Step 5 — Validate every path
For each field, confirm its path (`value ?? key`) resolves against the captured JSON **at the correct scope** (top-level against the root; children against the parent object; listItems against one array item). A path that doesn't resolve is a dead field. Re-capture if the shape is ambiguous. When many schemas are involved, verify them adversarially (one checker per schema against its real payload).

### Step 6 — Wire, version, build, lint
- Add `outputSchema: <name>` to each action/trigger object (or populate the trigger registration map — see [schema-reference.md](./schema-reference.md#wiring)).
- **Bump the piece's patch version** in its `package.json` (every touched piece).
- Rebuild the piece and reload the dev instance ([capture-recipes.md](./capture-recipes.md#dev-piece-reload)); confirm the friendly tree renders in the builder.
- Run `npm run lint-dev` (or `npx turbo run lint --filter=@activepieces/piece-<name>`). Typecheck must be clean.

## Verification checklist
- [ ] Every non-empty, non-generic action and every stable trigger has a schema (skips are deliberate per the table).
- [ ] Every schema was authored from **real captured output**, not documented/guessed shapes.
- [ ] `children`/`listItems` paths are **relative**; top-level array uses a `value: ''` wrapper + `itemLabel`.
- [ ] No `config`, `headers`, tokens, or auth secrets appear in any schema.
- [ ] Formats and `labelKey`/`itemLabel` applied where they help.
- [ ] Each touched piece's patch version bumped; build + `lint-dev` green; friendly tree verified in the builder.

## Note: how the schema reaches the builder
`outputSchema` is delivered via **served piece metadata** (dev pieces from `dist/`, published pieces from the registry). A past cloud bug stripped `outputSchema` during registry ingestion (`POST /v1/admin/pieces`) — **fixed in #13983**, which added `outputSchema` to the ingestion schema — so it's only a concern on server builds older than that fix. If a schema doesn't show up, first confirm the piece version was bumped and the served metadata actually carries `outputSchema` (rebuild + reload for dev pieces) before suspecting anything platform-side.

## Related
- `piece-builder` skill — building pieces and the `output-quality.md` reference (shaping `run()` return values for table-readiness) complements this skill, which describes an *existing* return.
- Files: [schema-reference.md](./schema-reference.md) · [capture-recipes.md](./capture-recipes.md)
