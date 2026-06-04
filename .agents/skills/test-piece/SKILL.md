---
name: test-piece
description: Locally test a piece action or trigger without starting the server. Reads piece source, collects auth/prop values, generates a runner script, executes it with tsx, and shows the result. Supports testing a single action/trigger or running all at once with a summary. Use when the user wants to test a piece action or trigger locally.
---

# Piece Local Tester

Run any piece action or trigger directly with `tsx` — no server, no UI, no flow creation.

**Performance rule**: the entire batch runs as **2 tsx invocations max**, not one per action. `npx tsx` startup costs 2-4 seconds — amortize it.

---

## Step 1 — Find the piece

Argument: `/test-piece packages/pieces/community/slack`

Piece roots:
- `packages/pieces/community/<name>/` — third-party integrations
- `packages/pieces/core/<name>/` — core pieces (http, delay, store, csv, etc.)

If no argument and user is inside a piece folder, use that. Otherwise ask.

---

## Step 2 — Choose mode

Specific action/trigger → **Single Mode**
All at once → **Batch Mode**

Skip the question if user already specified.

---

## Auth Types

Always determine auth before collecting any props. Read `src/lib/auth.ts` (preferred) or `src/index.ts`.

### `PieceAuth.SecretText`
```typescript
const auth = { secret_text: 'API_KEY_HERE' };
```

### `PieceAuth.BasicAuth`
```typescript
const auth = { username: 'user', password: 'pass' };
```

### `PieceAuth.OAuth2` / Cloud OAuth2 / Platform OAuth2
```typescript
const auth = {
  access_token: 'ya29.xxx',   // only mandatory field
  refresh_token: '',
  token_type: 'Bearer',
  scope: '',
  expires_in: 3600,
  claimed_at: 0,
  client_id: '',
  token_url: '',
  data: {},    // provider extras (e.g. bot_user_id for Slack)
  props: {},   // OAuth flow extras (e.g. subdomain)
};
```

### `PieceAuth.CustomAuth`
Read the `props` definition. Each key under `props` maps to `auth.props.<key>`. Keys typed as `PieceAuth.SecretText` are plain strings.
```typescript
// e.g. GitHub App: props: { appId, installationId, privateKey }
const auth = {
  props: { appId: '12345', installationId: '67890', privateKey: '-----BEGIN...' },
};
```
Some CustomAuth pieces read fields directly off `auth` (not `auth.props`) — check the source's `validate` and `run()` calls.

### Array of auth options (e.g. `notionAuth = [oAuth2Auth, customAuth]`)
Ask the user which auth type they're using before collecting credentials.

### No auth
```typescript
const auth = undefined;
```

---

## Prop Types

| Type | Collect | `propsValue` shape |
|---|---|---|
| `ShortText` / `LongText` | string | `'value'` |
| `Number` | number | `42` |
| `Checkbox` | true/false | `true` |
| `DateTime` | ISO string | `'2024-01-15T10:30:00.000Z'` |
| `Color` | hex string | `'#ff5733'` |
| `Json` | JSON string → parse | `{ key: 'val' }` |
| `Array` | comma-separated or JSON | `['a', 'b']` |
| `Object` | JSON string → parse | `{ key: 'val' }` |
| `DynamicProperties` | JSON object → pass as-is | `{ col: 'val' }` |
| `File` | file path → convert | `{ base64: '...', extension: 'png', filename: 'f.png' }` |
| `MarkDown` | display-only, skip | — |
| `StaticDropdown` | show options from source, user picks | `'option_value'` |
| `StaticMultiSelectDropdown` | show options, user picks multiple | `['v1', 'v2']` |
| `Dropdown` (dynamic) | resolve via script — see below | raw value/id |
| `MultiSelectDropdown` (dynamic) | resolve via script — see below | `['id1', 'id2']` |

**Required rules:**
- `required: true` + no saved value + no `defaultValue` → ask user
- `required: false` + has `defaultValue` → use silently
- `required: false` + no value + no default → pass `undefined`
- `required` as a function `(propsValue) => boolean` → evaluate with current props

---

## Dynamic Dropdown Resolution

Dynamic dropdowns have an `options` async function. Call it directly — real labels, real values, no server needed.

**`refreshers`**: other prop keys whose values must be passed into `options`. Always include them.

**One resolver script covers all dropdowns across all actions** — never write separate scripts per dropdown.

### Resolver script template (`_resolve_dropdowns.ts`)

```typescript
import { createDatabaseItem } from './src/lib/actions/create-database-item';
import { updateDatabaseItem } from './src/lib/actions/update-database-item';
// only actions/triggers that have unresolved dynamic dropdowns

const auth = <AUTH_VALUE>;

const toResolve = [
  {
    key: 'create_database_item.database_id',
    prop: (createDatabaseItem as any).props.database_id,
    ctx: { auth },  // add refresher prop values here if needed
  },
  {
    key: 'update_database_item.database_id',
    prop: (updateDatabaseItem as any).props.database_id,
    ctx: { auth },
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

Run: `npx tsx _resolve_dropdowns.ts` from the piece root. Parse JSON output:
- `{ options: [...] }` → show labels, ask user to pick
- `{ disabled: true }` → dependent prop missing or auth invalid → ask for raw value
- `{ error: '...' }` → show error → ask for raw value

Delete `_resolve_dropdowns.ts` after. **Large lists** (> 100 options): ask for a search term and re-run with `searchValue`.

---

## Single Mode

### S1 — List & pick
Read `src/index.ts`, show displayNames, ask user to pick one.

### S2 — Read source
Extract all props (type, required, defaultValue) and auth type.

### S3 — Load saved config
Read `.piece-test.json`. Use saved values, ask only for what's missing.

### S4 — Resolve dynamic dropdowns
Collect all dynamic dropdowns in this one action with no saved value. Write ONE `_resolve_dropdowns.ts`, run it, show options, ask user to pick, delete it.

### S5 — Run
Write `_test_runner.ts` (single-action template), run `npx tsx _test_runner.ts`, show result, delete it. Save to `.piece-test.json`.

---

## Single-Action Runner Template

```typescript
import { <ExportName> } from './src/lib/actions/<file>';
// or: import { <ExportName> } from './src/lib/triggers/<file>';

const auth = <AUTH_VALUE>;
const propsValue = <PROPS_VALUE>;

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

<ExportName>.run(context)
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

If the action has `test()`, prefer `.test(context)` over `.run(context)`.
For trigger `onEnable`/`onDisable`, call `.onEnable(context)` / `.onDisable(context)`.

---

## Batch Mode

### B1 — Read everything
Read `src/index.ts`. Read every action and trigger source file. Extract all props and auth type.

### B2 — Load saved config
Determine for each action/trigger:
- Required props with no saved value and no default → need to ask user
- Dynamic dropdowns with no saved value → collect with one resolver script
- Items with all props satisfied → ready to run

Mark items with unsatisfiable required props as `⏭️ skipped`.

### B3 — Resolve ALL dropdowns (one script)
Write **one** `_resolve_dropdowns.ts` covering every unresolved dynamic dropdown across all actions/triggers. Run once, parse JSON, ask user to pick all values at once. Delete the file.

### B4 — Collect remaining missing values
Ask user for any still-missing required text/number/checkbox props. Batch all questions at once.

### B5 — Run everything (one script)
Write **one** `_test_runner.ts` with all actions/triggers. Run `npx tsx _test_runner.ts` once. Parse `__START__:name` / `__END__:name` markers. Delete the file. Print one status line per item as you parse:
```
✅ Create Database Item
❌ Update Database Item   — 404 Not Found
⏭️ Archive Item           — skipped (no item_id saved)
```

### B6 — Print summary
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
Print full error output below the table for each failure.

### B7 — Offer next step
Save new prop values to `.piece-test.json`. Ask: "Re-run a specific failure, or run all again?"

---

## Batch Runner Template

One file, one `npx tsx` call, all actions/triggers inside. Per-action 30s timeout prevents a hanging action from blocking the rest.

```typescript
import { createDatabaseItem } from './src/lib/actions/create-database-item';
import { updateDatabaseItem } from './src/lib/actions/update-database-item';
// ... all imports

const auth = <AUTH_VALUE>;

function makeContext(propsValue: any): any {
  return {
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
}

const TIMEOUT_MS = 30_000;

function withTimeout(fn: () => Promise<unknown>): Promise<unknown> {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timed out after 30s')), TIMEOUT_MS)
    ),
  ]);
}

const items: Array<{ name: string; run: () => Promise<unknown> }> = [
  {
    name: 'create_database_item',
    run: () => withTimeout(() =>
      createDatabaseItem.run(makeContext({ database_id: '<VALUE>' }))
    ),
  },
  {
    name: 'update_database_item',
    run: () => withTimeout(() =>
      updateDatabaseItem.run(makeContext({ database_id: '<VALUE>', item_id: '<VALUE>' }))
    ),
  },
  // ... all other actions/triggers
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
      if (err?.response?.data) {
        process.stdout.write(JSON.stringify(err.response.data, null, 2) + '\n');
      }
    }
    process.stdout.write(`__END__:${item.name}\n`);
  }
  process.exit(0);
}

runAll();
```

**Parsing output**: split on `__START__:<name>` … `__END__:<name>` blocks. Each block contains `__PASS__\n<json>` or `__FAIL__\n<error>`.

---

## Trigger Strategies

| Strategy | How to test |
|---|---|
| `POLLING` | Call `run(context)` — returns array. `[]` = no new data, not a failure. |
| `WEBHOOK` | Call `onEnable(context)` to register, `onDisable(context)` to clean up. Mock `context.payload` for `run()`. |
| `APP_WEBHOOK` | Same as WEBHOOK. |

WEBHOOK mock payload:
```typescript
payload: { body: { /* webhook data */ }, headers: {}, queryParams: {} }
```

---

## Re-runs

Load `.piece-test.json`, confirm saved values, ask: "Use saved values or change something?" Run immediately if all values present — no re-prompting.

---

## `.piece-test.json` Format

```json
{
  "auth": { "secret_text": "..." },
  "actions": {
    "create_database_item": { "database_id": "abc123" }
  },
  "triggers": {
    "new_database_item": { "database_id": "abc123" }
  }
}
```

Key = `name` field from `createAction`/`createTrigger` (snake_case, not displayName). Gitignored — safe for real credentials.

---

## Circular Dependency Fix

**Symptom**: `Cannot access 'myAuth' before initialization`
**Cause**: actions import auth from `'../../'` (index.ts), index.ts also imports actions → ESM TDZ cycle.

**Fix** (one-time per piece):
1. Create `src/lib/auth.ts`, move auth definition there.
2. All actions: `import { myAuth } from '../../'` → `import { myAuth } from '../auth'`
3. `src/index.ts`: `import { myAuth } from './lib/auth'` + `export { myAuth }` at end.

Apply automatically when detected. Check if `src/lib/auth.ts` already exists first.

---

## Error Reference

| Error | Action |
|---|---|
| `Cannot find module` | `npm install` in piece root, retry |
| `Cannot access 'X' before initialization` | Circular dep → fix above |
| `401 Unauthorized` | Wrong credentials → ask user to re-enter |
| `403 Forbidden` | Token missing required scope → tell user |
| `422 Unprocessable Entity` | Bad prop values → print response body |
| `404 Not Found` | Wrong ID in a prop → ask user to correct |
| Dropdown `options()` throws | Show error, fall back to raw value |
| `disabled: true` from options | Dependent prop missing → collect it first |
| Trigger returns `[]` | Valid — no new data |
| Action timed out (30s) | Network hang → report |
| `tsconfig` errors | `npx tsx --skipLibCheck _test_runner.ts` |

---

## Notes

- `packages/pieces/core/` uses the same structure.
- `MarkDown` props: display-only, never collect a value.
- `required` as a function: evaluate with currently collected props.
- `context.connections.get()`: mock as `null` unless the action specifically needs a named secondary connection.
- Multiple auth exports as array: ask user which type before collecting credentials.
