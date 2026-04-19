---
name: piece-builder
description: Builds Activepieces pieces (integrations) with actions and triggers. Use when the user asks to create a new piece, add actions to a piece, add triggers to a piece, or build an integration for a third-party app. Also use when the user mentions Activepieces pieces, connectors, or integration development.
---

# Activepieces Piece Builder

Build pieces (integrations) for the Activepieces automation platform. Each piece provides **actions** (operations users can perform) and **triggers** (events that start flows).

## Workflow

Follow these 5 steps every time:

### Step 1: RESEARCH

-   Search the web for the target app's REST API documentation
-   Identify the auth method (API key, OAuth2, Basic Auth, custom)
-   List available endpoints; check if webhooks are supported
-   Note base URL, pagination, and rate limits

### Step 2: PLAN

-   **Determine piece location from the user's request:**
    -   If the user says **"custom piece"** → use `packages/pieces/custom/` (no need to ask)
    -   Otherwise → default to `packages/pieces/community/`
    -   See the Piece Types table below for full reference
-   Choose the correct auth type -- see Quick Auth Reference below
-   Select the most useful actions (CRUD, search, list)
-   Select triggers (webhook if API supports it, polling otherwise)
-   **ASK THE USER** if unsure about OAuth2 config, which actions to prioritize, or ambiguous API behavior

### Step 3: SCAFFOLD

#### Option A: CLI (recommended)

```bash
npm run cli pieces create
# Enter: piece name, package name (@activepieces/piece-<name>), type (community)

npm run cli actions create
# Enter: piece folder name, action display name, description

npm run cli triggers create
# Enter: piece folder name, trigger display name, description, technique (polling/webhook)
```

#### Option B: Manual File Creation (when CLI fails/is unavailable)

Create this structure under `packages/pieces/community/<name>/`:

```
src/
  index.ts
  lib/
    actions/            # One file per action
    triggers/           # One file per trigger
    common/             # Shared helpers (optional)
package.json
project.json
.eslintrc.json
tsconfig.json
tsconfig.lib.json
```

Copy config files from an existing simple piece (e.g. `packages/pieces/core/qrcode/`) and replace `<name>` throughout. Templates:

**package.json**

```json
{
    "name": "@activepieces/piece-<name>",
    "version": "0.0.1",
    "dependencies": {}
}
```

**`.eslintrc.json`**

```json
{
    "extends": ["../../../../.eslintrc.base.json"],
    "ignorePatterns": ["!**/*"],
    "overrides": [
        { "files": ["*.ts", "*.tsx", "*.js", "*.jsx"], "rules": {} },
        { "files": ["*.ts", "*.tsx"], "rules": {} },
        { "files": ["*.js", "*.jsx"], "rules": {} }
    ]
}
```

**`tsconfig.json`**

```json
{
    "extends": "../../../../tsconfig.base.json",
    "compilerOptions": {
        "module": "commonjs",
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true
    },
    "files": [],
    "include": [],
    "references": [{ "path": "./tsconfig.lib.json" }]
}
```

**`tsconfig.lib.json`**

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "rootDir": ".",
        "baseUrl": ".",
        "paths": {},
        "outDir": "./dist",
        "declaration": true,
        "types": ["node"]
    },
    "include": ["src/**/*.ts"],
    "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
```

### Step 4: IMPLEMENT

**Read these files before writing any code:**

| What you're implementing                        | Read this file        |
| ----------------------------------------------- | --------------------- |
| Auth setup                                      | `auth-patterns.md`    |
| Action structure                                | `action-patterns.md`  |
| Trigger structure (polling or webhook)          | `trigger-patterns.md` |
| Any props -- actions or triggers                | `props-patterns.md`   |
| HTTP client, shared helpers, pagination         | `common-patterns.md`  |
| Every prop and dropdown **(mandatory for all)** | `ux-guidelines.md`    |
| Every return value **(mandatory for all)**      | `output-quality.md`   |
| **AI metadata (mandatory on every action & trigger)** | `SKILL.md` → AI Metadata section |

`ux-guidelines.md`, `output-quality.md`, and the **AI Metadata** section apply to **every** action and trigger -- read them before starting, not only when unsure.

### Step 5: WIRE & VERIFY

#### Wiring checklist (complete all before building)

-   [ ] Import every action in `src/index.ts` and add to `actions: [...]`
-   [ ] Import every trigger in `src/index.ts` and add to `triggers: [...]`
-   [ ] Export auth from `src/index.ts` so actions/triggers can import it via `import { myAppAuth } from '../../'`
-   [ ] Add `createCustomApiCallAction` to `actions: [...]` for power users
-   [ ] Register in `tsconfig.base.json` at the repo root (insert **alphabetically**):
    ```json
    "@activepieces/piece-<name>": ["packages/pieces/community/<name>/src/index.ts"]
    ```
    **Build fails without this step.**

#### Build

```bash
bun install
npx turbo run build --filter=@activepieces/piece-<name>
```

`bun install` is required for new pieces so the workspace symlinks are created before TypeScript can resolve imports. Skip it on subsequent rebuilds.

Fix TypeScript errors and rebuild. Common causes: missing import in `src/index.ts`, missing `tsconfig.base.json` entry, wrong type cast on `context.auth` (use `context.auth as unknown as string` for SecretText), missing `sampleData` on a trigger.

#### Test locally

Add to `packages/server/api/.env`:

```
AP_DEV_PIECES=<name>
```

Start the dev server (`npm start`), open `localhost:4200`, sign in with `dev@ap.com` / `12345678`, and find your piece in the flow builder.

---

## Piece Types

| Location | Purpose |
|---|---|
| `packages/pieces/community/` | Third-party integrations (Slack, Stripe, etc.) -- use this for almost all work |
| `packages/pieces/core/` | Built-in platform utilities (HTTP, Store, Math, etc.) -- do NOT recreate these |
| `packages/pieces/custom/` | Private customer-specific pieces |

Full reference: [piece-types.md](piece-types.md) -- includes all `PieceCategory` values and the list of existing core pieces.

## Folder Structure

```
packages/pieces/community/<piece-name>/
  src/
    index.ts              # Piece definition (auth + imports + createPiece)
    lib/
      actions/            # One file per action
      triggers/           # One file per trigger
      common/             # Shared API helpers and dropdown definitions
  package.json
  project.json
  .eslintrc.json
  tsconfig.json
  tsconfig.lib.json
```

## Quick Auth Reference

| API Auth Method        | Activepieces Type        | Access Pattern                       |
| ---------------------- | ------------------------ | ------------------------------------ |
| API key / Bearer token | `PieceAuth.SecretText()` | `context.auth` (string)              |
| OAuth2                 | `PieceAuth.OAuth2()`     | `context.auth.access_token`          |
| Username + password    | `PieceAuth.BasicAuth()`  | `context.auth.username`, `.password` |
| Multiple fields        | `PieceAuth.CustomAuth()` | `context.auth.<field_name>`          |
| No auth needed         | `PieceAuth.None()`       | No `context.auth` available          |

Full code examples: read `auth-patterns.md`

## Quick Piece Definition Template

```typescript
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { myAction } from './lib/actions/my-action';
import { myTrigger } from './lib/triggers/my-trigger';

export const myAppAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Go to Settings > API Keys in your dashboard to generate a key.',
    required: true,
});

export const myApp = createPiece({
    displayName: 'My App',
    description: 'What the app does in one sentence.',
    minimumSupportedRelease: '0.36.1',
    // Logo: add a PNG to packages/pieces/community/<name>/ and reference it here.
    logoUrl: 'https://cdn.activepieces.com/pieces/my-app.png',
    categories: [PieceCategory.PRODUCTIVITY],
    auth: myAppAuth,
    authors: ['your-github-username'], // GitHub usernames of contributors
    actions: [
        myAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.example.com/v1',
            auth: myAppAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [myTrigger],
    // If the piece needs third-party npm packages, declare them here:
    // npmDependencies: { 'some-sdk': '^1.0.0' },
});
```

## UX Quality: Easy for Non-Technical Users

Pieces are used by people who have never seen an API. Every prop, dropdown, and description must be clear enough to use without reading external docs.

**Rules:**

1. **Never ask users to type IDs** -- Use dynamic dropdowns so they pick items by name (e.g. `"Jane Doe (jane@x.com)"` not `"cus_abc123"`).
2. **Descriptions must teach** -- Don't say "Enter the thread timestamp." Say "Click the three dots next to the message, select Copy Link, and paste the number at the end."
3. **Use Markdown instructions** for complex setup -- Add `Property.MarkDown()` with numbered steps when a prop requires configuration in the third-party app.
4. **Set sensible defaults** -- If 90% of users want the same value, make it the default.
5. **Plain language display names** -- `"Create Contact"` not `"POST /contacts"`. Triggers: `"New Order"` not `"order.created webhook"`.
6. **Auth descriptions** must include step-by-step instructions to get the API key or set up OAuth.
7. **Helpful dropdown placeholders** -- `"Please select a project first"` not just empty.

Full patterns and examples: read `ux-guidelines.md`

## Output Quality: Table-Ready Data

Every action output must be directly mappable to Google Sheets, Excel, and Activepieces Tables. Users pipe piece outputs into spreadsheets constantly -- if your output is nested or inconsistent, it breaks their flows.

**Rules:**

1. **Flatten nested objects** -- No nested objects in output. Turn `{ user: { name: "Jo", email: "jo@x.com" } }` into `{ user_name: "Jo", user_email: "jo@x.com" }`.
2. **Arrays of records must have consistent flat keys** -- Every object in a list must have the same keys so each key maps to a column.
3. **Single-record actions** return a flat object (one row).
4. **List/search actions** return a flat array where each element is one row.
5. **Use human-readable key names** -- `company_name` not `cName`. These become column headers.

Full patterns and examples: read `output-quality.md`

## AI Metadata: Required for Every Action & Trigger

Pieces must be usable by AI agents and MCP clients. **Every action and trigger must populate the `infoForLLM` bundle** -- it is not optional.

### Required on every `createAction` / `createTrigger`

The `infoForLLM` bundle groups all agent-facing metadata under a single optional object on the action/trigger params. Populate every inner field:

```typescript
import { createAction, ActionDifficulty } from '@activepieces/pieces-framework';

// ...
infoForLLM: {
  description: '...',                  // see template below
  tags: ['write', '...'],              // one verb tag + one domain tag
  difficulty: ActionDifficulty.EASY,   // enum: EASY | MEDIUM | HARD
  outputSchema: `...`,                 // string — see below
},
```

| Inner field | Type | Purpose |
|---|---|---|
| `description` | `string` | LLM-optimized description. Template: `"<Verb> <what>. Use when <situation>. <Constraints>."` Max ~500 chars. |
| `tags` | `string[]` | Classification tags. Pick one verb tag from: `read`, `write`, `delete`, `search`, `list` -- plus one domain tag (`issues`, `messages`, `files`, `contacts`, etc.). |
| `difficulty` | `ActionDifficulty` | Enum exported by `@activepieces/pieces-framework`. Values: `ActionDifficulty.EASY` (single API call, no dependencies), `ActionDifficulty.MEDIUM` (multiple calls, needs lookups), `ActionDifficulty.HARD` (multi-step with side effects). Use the enum member, not the string literal — TypeScript rejects a bare `'easy'`. |
| `outputSchema` | `string` | Describes the shape returned by `run()` (or emitted by the trigger). Use a **stringified JSON example** for static shapes or **prose-with-example** for dynamic outputs (HTTP responses, spreadsheet rows, SQL queries). Always use backtick template literals. Required on actions; strongly recommended on triggers that emit a non-trivial payload. |

### Required on every `Property`

| Field | Type | Purpose |
|---|---|---|
| `example` | `unknown` | A realistic sample value showing the expected format. Not `"string"` or `"value"` -- an actual example. |

### Description writing rules

-   **Verb-first:** `"Creates"`, `"Fetches"`, `"Searches"`, `"Updates"`, `"Deletes"` -- never noun-first.
-   **Two parts:** what it does + when to use it.
-   **State constraints:** `"Requires a repository owner"`, `"Returns up to 100 results"`, `"At least one of X or Y must be provided"`.
-   **Under 500 characters** -- shorter wins for LLM context.

**Bad:** `"Create Issue in GitHub Repository"`
**Good:** `"Creates a new issue in a GitHub repository. Use when you need to report a bug, request a feature, or track work. Requires repository owner and name. Returns issue number and URL."`

### Property `example` rules

-   Show format, not just concept.
-   For IDs: show the real format (`"cus_abc123xyz"`, not `"id"`).
-   For enums: pick a common one (`"open"`, not `"status"`).
-   For dates: ISO 8601 (`"2026-04-17T10:30:00Z"`).
-   For URLs: full URL (`"https://example.com/file.pdf"`).

**Bad:** `description: "The title"` (no example)
**Good:** `description: "Issue title. Max 255 characters.", example: "Bug: Login page crashes on mobile Safari"`

### Optional but recommended: `ActionResult<T>` return type

For new actions, wrap the return in the `ActionResult<T>` type exported from `@activepieces/pieces-framework`:

```typescript
import { ActionResult } from '@activepieces/pieces-framework';

async run(context): Promise<ActionResult<{ number: number; html_url: string }>> {
  try {
    const issue = await createIssue(context.propsValue);
    return { success: true, data: { number: issue.number, html_url: issue.html_url } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
```

This gives agents a predictable success/error shape instead of raw API responses.

## Critical Reminders

1. **AI Metadata is MANDATORY** -- every action/trigger must have an `infoForLLM` bundle with `description`, `tags`, `difficulty`, and `outputSchema` (for actions, and for triggers that emit a non-trivial payload); every property must have `example`. See the AI Metadata section above.
2. **Register in tsconfig.base.json** -- Alphabetically in `compilerOptions.paths`. Build fails without this.
3. **Action names are permanent** -- The `name` field in `createAction`/`createTrigger` must never change after publishing.
4. **Export auth from index.ts** -- Actions and triggers import auth via `import { myAppAuth } from '../../'`.
5. **Always provide sampleData** on triggers -- Even if it's just `{}`.
6. **ux-guidelines.md and output-quality.md are mandatory** -- Read them before implementing any action or trigger.

## When to Ask the User

Always pause and ask if:

-   OAuth2 authUrl/tokenUrl/scopes are not found in API docs
-   Auth method is unclear or undocumented
-   More than 10 possible actions exist -- ask which to prioritize
-   API uses webhook signature verification
-   You need test credentials or sandbox access
