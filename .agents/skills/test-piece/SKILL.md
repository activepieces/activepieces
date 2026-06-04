---
name: test-piece
description: Locally test a piece action or trigger without starting the server. Reads piece source, collects auth/prop values, generates a runner script, executes it with tsx, and shows the result. Supports testing a single action/trigger or running all at once with a summary. Use when the user wants to test a piece action or trigger locally.
---

# Piece Local Tester

!Test any piece action or trigger with `tsx` — no server, no UI, no flow creation. Runs the real `run()` function against the real API.

**Performance rule**: batch mode uses **2 tsx invocations max** regardless of how many actions the piece has. `npx tsx` startup costs 2–4 seconds — never run it once per action.

## Workflow

### Step 1: FIND THE PIECE

-   Piece argument: `/test-piece packages/pieces/community/slack`
-   Piece roots: `packages/pieces/community/<name>/` or `packages/pieces/core/<name>/`
-   If no argument and user is inside a piece folder, use that piece
-   Otherwise ask

### Step 2: CHOOSE MODE

-   **Specific action or trigger** → Single Mode (steps 3–5 below)
-   **All at once** → Batch Mode (steps 3–5 below, with batch variants)
-   Skip this question if the user already specified

### Step 3: COLLECT AUTH & PROPS

**Load saved config first**: read `.piece-test.json`. Only ask for what's missing.

**Auth** — read `src/lib/auth.ts` (preferred) or `src/index.ts`. See Quick Auth Reference below.
- If the piece exports an array of auth options (e.g. `notionAuth = [oAuth2, customAuth]`), ask the user which to use before collecting

**Props** — read the action/trigger source file. See Quick Prop Reference below.
- Required prop + no saved value + no `defaultValue` → ask the user
- Optional prop + `defaultValue` → use silently
- Optional prop + no value + no default → pass `undefined`
- `required` is sometimes a function `(propsValue) => boolean` — evaluate with current props

### Step 4: RESOLVE DROPDOWNS

Dynamic dropdowns (`Property.Dropdown`, `Property.MultiSelectDropdown`) have an `options` async function — call it directly to get real labels and values.

**One resolver script covers all dropdowns for the entire run** — never one script per dropdown.

Write `_resolve_dropdowns.ts` (see template below), run `npx tsx _resolve_dropdowns.ts` from the piece root, parse the JSON output, ask the user to pick, then delete the file.

Result shapes:
-   `{ options: [{label, value}] }` → show list, ask user to pick
-   `{ disabled: true }` → dependent prop missing or auth invalid → ask for raw value
-   `{ error: '...' }` → show error → ask for raw value

**`refreshers`**: the dropdown's `refreshers` array lists other prop keys whose values must be included when calling `options()`. Always pass them.

### Step 5: RUN

**Single mode** — write `_test_runner.ts` (single-action template), run `npx tsx _test_runner.ts`, show result, delete it.

**Batch mode** — write ONE `_test_runner.ts` with all actions/triggers in a loop, run it once, parse `__START__:name` / `__END__:name` markers, print one status line per action as you parse, then print the summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NOTION — TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Create Database Item
  ✅  Find Database Item
  ❌  Update Database Item   — 404 Not Found
  ⏭️  Archive Item           — skipped (no item_id saved)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Passed: 2 / 4   Failed: 1 / 4   Skipped: 1 / 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Print full error output below the table for each failure. Then save new values to `.piece-test.json` and ask: "Re-run a failure, or run all again?"

---

## Quick Auth Reference

In `_test_runner.ts`, `context.auth` must match the shape the piece reads:

| Auth Type | Shape to pass as `auth` |
|---|---|
| `PieceAuth.SecretText` | `{ secret_text: 'API_KEY' }` |
| `PieceAuth.BasicAuth` | `{ username: 'u', password: 'p' }` |
| `PieceAuth.OAuth2` | `{ access_token: 'ya29.xxx', refresh_token: '', token_type: 'Bearer', scope: '', expires_in: 3600, claimed_at: 0, client_id: '', token_url: '', data: {}, props: {} }` — only `access_token` is mandatory |
| `PieceAuth.CustomAuth` | `{ props: { field1: 'val1', field2: 'val2' } }` — keys from the `props` definition; `PieceAuth.SecretText` keys are plain strings |
| No auth | `undefined` |

Some CustomAuth pieces read fields directly off `auth` (not `auth.props`) — check the source's `validate` and `run()` calls to confirm the shape.

---

## Quick Prop Reference

| Type | Value in `propsValue` |
|---|---|
| `ShortText` / `LongText` | `'string'` |
| `Number` | `42` (number, not string) |
| `Checkbox` | `true` or `false` |
| `DateTime` | `'2024-01-15T10:30:00.000Z'` |
| `Color` | `'#ff5733'` |
| `Json` | parsed object `{ key: 'val' }` |
| `Array` | `['a', 'b', 'c']` |
| `Object` | parsed object `{ key: 'val' }` |
| `DynamicProperties` | JSON object as-is `{ col: 'val' }` |
| `File` | `{ base64: '...', extension: 'png', filename: 'f.png' }` |
| `MarkDown` | skip — display-only, no value |
| `StaticDropdown` | the `value` field (not label) from options in source |
| `StaticMultiSelectDropdown` | `['value1', 'value2']` |
| `Dropdown` / `MultiSelectDropdown` | resolve via `_resolve_dropdowns.ts` — see template |

---

## Trigger Strategies

| Strategy | What to test |
|---|---|
| `POLLING` | Call `run(context)` — returns array. `[]` = no new data, not a failure. |
| `WEBHOOK` / `APP_WEBHOOK` | Call `onEnable(context)` to register, `onDisable(context)` to clean up. For `run()`, add mock `payload: { body: {}, headers: {}, queryParams: {} }` to context. |

---

## Templates

### Dropdown Resolver (`_resolve_dropdowns.ts`)

```typescript
import { actionOne } from './src/lib/actions/action-one';
import { actionTwo } from './src/lib/actions/action-two';
// only imports for actions with unresolved dynamic dropdowns

const auth = /* paste auth value */;

const toResolve = [
  {
    key: 'action_one.spreadsheet_id',
    prop: (actionOne as any).props.spreadsheet_id,
    ctx: { auth },  // add refresher prop values here if the dropdown has refreshers
  },
  {
    key: 'action_two.sheet_id',
    prop: (actionTwo as any).props.sheet_id,
    ctx: { auth, spreadsheet_id: 'already-resolved-value' },
  },
];

async function resolveAll() {
  const results: Record<string, any> = {};
  for (const { key, prop, ctx } of toResolve) {
    try {
      const result = await prop.options(ctx, { searchValue: undefined });
      results[key] = result.disabled
        ? { disabled: true, placeholder: result.placeholder }
        : { options: result.options };
    } catch (err: any) {
      results[key] = { error: err?.message ?? String(err) };
    }
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

resolveAll();
```

If a list has > 100 options, ask the user for a search term and re-run with `searchValue`.

---

### Single-Action Runner (`_test_runner.ts`)

```typescript
import { myAction } from './src/lib/actions/my-action';

const auth = /* paste auth value */;
const propsValue = /* paste props */;

const context: any = {
  executionType: 'BEGIN',
  auth,
  propsValue,
  store: {
    put: async (_k: string, v: unknown) => v,
    get: async (_k: string) => null,
    delete: async (_k: string) => undefined,
  },
  connections: { get: async (_n: string) => null },
  tags: { add: async (_t: string) => undefined },
  server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', token: 'test-token' },
  files: { write: async ({ fileName }: { fileName: string }) => `test-file-url/${fileName}` },
  output: { update: async () => undefined },
  agent: { tools: async () => ({}) },
  run: {
    id: 'test-run-id',
    stop: () => undefined,
    pause: () => undefined,
    respond: () => undefined,
    createWaitpoint: async () => ({ waitpointId: 'test-waitpoint-id' }),
    waitForWaitpoint: async () => undefined,
  },
  project: { id: 'test-project-id', externalId: async () => undefined },
  flows: {
    list: async () => ({ data: [], next: null, previous: null }),
    current: { id: 'test-flow-id', version: { id: 'test-flow-version-id' } },
  },
  step: { name: 'test-step' },
  generateResumeUrl: () => 'http://localhost:3000/resume',
};

myAction.run(context)
  .then((result: unknown) => {
    console.log('✅ SUCCESS');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err: any) => {
    console.error('❌ ERROR:', err?.message ?? String(err));
    if (err?.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
    process.exit(1);
  });
```

If the action has `test()`, call `.test(context)` instead of `.run(context)`.

---

### Batch Runner (`_test_runner.ts`)

All actions in one process, one tsx startup, 30s timeout per action.

```typescript
import { actionOne } from './src/lib/actions/action-one';
import { actionTwo } from './src/lib/actions/action-two';
// ... all imports

const auth = /* paste auth value */;

function makeContext(propsValue: any): any {
  return {
    executionType: 'BEGIN', auth, propsValue,
    store: { put: async (_k: string, v: unknown) => v, get: async () => null, delete: async () => undefined },
    connections: { get: async () => null },
    tags: { add: async () => undefined },
    server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', token: 'test-token' },
    files: { write: async ({ fileName }: { fileName: string }) => `test-file-url/${fileName}` },
    output: { update: async () => undefined },
    agent: { tools: async () => ({}) },
    run: { id: 'test-run-id', stop: () => undefined, pause: () => undefined, respond: () => undefined,
      createWaitpoint: async () => ({ waitpointId: 'test-waitpoint-id' }), waitForWaitpoint: async () => undefined },
    project: { id: 'test-project-id', externalId: async () => undefined },
    flows: { list: async () => ({ data: [], next: null, previous: null }),
      current: { id: 'test-flow-id', version: { id: 'test-flow-version-id' } } },
    step: { name: 'test-step' },
    generateResumeUrl: () => 'http://localhost:3000/resume',
  };
}

function withTimeout(fn: () => Promise<unknown>): Promise<unknown> {
  return Promise.race([fn(), new Promise((_, r) => setTimeout(() => r(new Error('Timed out after 30s')), 30_000))]);
}

const items = [
  { name: 'action_one', run: () => withTimeout(() => actionOne.run(makeContext({ prop1: 'value' }))) },
  { name: 'action_two', run: () => withTimeout(() => actionTwo.run(makeContext({ prop1: 'value', prop2: 42 }))) },
  // ... all actions/triggers
];

async function runAll() {
  for (const item of items) {
    process.stdout.write(`__START__:${item.name}\n`);
    try {
      const result = await item.run();
      process.stdout.write('__PASS__\n');
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    } catch (err: any) {
      process.stdout.write('__FAIL__\n');
      process.stdout.write((err?.message ?? String(err)) + '\n');
      if (err?.response?.data) process.stdout.write(JSON.stringify(err.response.data, null, 2) + '\n');
    }
    process.stdout.write(`__END__:${item.name}\n`);
  }
  process.exit(0);
}

runAll();
```

Parse by splitting on `__START__:<name>` … `__END__:<name>` blocks. Each contains `__PASS__\n<json>` or `__FAIL__\n<error>`.

---

## `.piece-test.json` Format

```json
{
  "auth": { "secret_text": "..." },
  "actions": {
    "action_name": { "prop1": "value1", "prop2": 42 }
  },
  "triggers": {
    "trigger_name": { "prop1": "value1" }
  }
}
```

Key = `name` field from `createAction`/`createTrigger` (snake_case). Gitignored — safe for real credentials.

---

## Critical Reminders

1. **2 tsx invocations max in batch** — one `_resolve_dropdowns.ts` + one `_test_runner.ts`. Never one per action or per dropdown.
2. **Auth shape must match what the piece reads** — check `validate()` and `run()` in the source. CustomAuth often uses `auth.props.<key>`, sometimes `auth.<key>` directly.
3. **`MarkDown` props are display-only** — never collect a value for them.
4. **POLLING trigger returning `[]` is not a failure** — it means no new data.
5. **Dynamic dropdowns depend on refreshers** — always pass the refresher prop values when calling `options()`.
6. **Re-runs are instant** — load `.piece-test.json`, confirm saved values, run without re-prompting.

---

## Error Reference

| Error | Fix |
|---|---|
| `Cannot find module` | `npm install` in piece root, retry |
| `Cannot access 'X' before initialization` | Circular dep: create `src/lib/auth.ts`, move auth there, update all action imports from `'../../'` to `'../auth'`, update `src/index.ts` |
| `401 Unauthorized` | Wrong credentials → ask user to re-enter |
| `403 Forbidden` | Token missing required scope → tell user |
| `422 Unprocessable Entity` | Bad prop values → print response body |
| `404 Not Found` | Wrong ID in a prop → ask user to correct |
| Dropdown `options()` throws | Show error, fall back to raw value from user |
| `disabled: true` from options | Dependent prop missing → collect it first, retry |
| Action timed out (30s) | Network hang or blocking API → report to user |
| `tsconfig` errors | `npx tsx --skipLibCheck _test_runner.ts` |
