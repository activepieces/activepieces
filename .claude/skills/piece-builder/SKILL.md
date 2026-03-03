---
name: piece-builder
description: Builds Activepieces pieces (integrations) with actions and triggers. Use when the user asks to create a new piece, add actions to a piece, add triggers to a piece, or build an integration for a third-party app. Also use when the user mentions Activepieces pieces, connectors, or integration development.
---

# Activepieces Piece Builder

Build pieces (integrations) for the Activepieces automation platform. Each piece provides **actions** (operations users can perform) and **triggers** (events that start flows).

## Workflow

Follow these 5 steps every time:

### Step 1: RESEARCH
- Search the web for the target app's REST API documentation
- Identify the auth method (API key, OAuth2, Basic Auth, custom)
- List available endpoints; check if webhooks are supported
- Note base URL, pagination, and rate limits

### Step 2: PLAN
- Choose the correct auth type -- see [auth-patterns.md](auth-patterns.md)
- Select the most useful actions (CRUD, search, list)
- Select triggers (webhook if API supports it, polling otherwise)
- **ASK THE USER** if unsure about OAuth2 config, which actions to prioritize, or ambiguous API behavior

### Step 3: SCAFFOLD
```bash
npm run cli pieces create
# Enter: piece name, package name (@activepieces/piece-<name>), type (community)

npm run cli actions create
# Enter: piece folder name, action display name, description

npm run cli triggers create
# Enter: piece folder name, trigger display name, description, technique (polling/webhook)
```

If the CLI fails (no `node_modules`), create files manually -- see [wiring-checklist.md](wiring-checklist.md) for the full file list and templates to copy.

### Step 4: IMPLEMENT
Fill in the generated files using the patterns in:
- [auth-patterns.md](auth-patterns.md) -- Authentication setup
- [action-patterns.md](action-patterns.md) -- Actions and property types
- [trigger-patterns.md](trigger-patterns.md) -- Polling and webhook triggers
- [common-patterns.md](common-patterns.md) -- HTTP client, shared helpers, dropdowns

### Step 5: VERIFY
```bash
npx nx run-many -t build --projects=pieces-<piece-name>
```
Fix TypeScript errors. Ask the user to test in the UI if needed.

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

| API Auth Method | Activepieces Type | Access Pattern |
|----------------|-------------------|----------------|
| API key / Bearer token | `PieceAuth.SecretText()` | `context.auth` (string) |
| OAuth2 | `PieceAuth.OAuth2()` | `context.auth.access_token` |
| Username + password | `PieceAuth.BasicAuth()` | `context.auth.username`, `.password` |
| Multiple fields | `PieceAuth.CustomAuth()` | `context.auth.<field_name>` |
| No auth needed | `PieceAuth.None()` | No `context.auth` available |

Full code examples: [auth-patterns.md](auth-patterns.md)

## Quick Piece Definition Template

```typescript
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { myAction } from './lib/actions/my-action';
import { myTrigger } from './lib/triggers/my-trigger';

export const myAppAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});

export const myApp = createPiece({
  displayName: 'My App',
  description: 'What the app does',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/my-app.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: myAppAuth,
  authors: [],
  actions: [myAction],
  triggers: [myTrigger],
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

Full patterns and examples: [ux-guidelines.md](ux-guidelines.md)

## Output Quality: Table-Ready Data

Every action output must be directly mappable to Google Sheets, Excel, and Activepieces Tables. Users pipe piece outputs into spreadsheets constantly -- if your output is nested or inconsistent, it breaks their flows.

**Rules:**
1. **Flatten nested objects** -- No nested objects in output. Turn `{ user: { name: "Jo", email: "jo@x.com" } }` into `{ user_name: "Jo", user_email: "jo@x.com" }`.
2. **Arrays of records must have consistent flat keys** -- Every object in a list must have the same keys so each key maps to a column.
3. **Single-record actions** return a flat object (one row).
4. **List/search actions** return `{ rows: [...] }` or a flat array where each element is one row.
5. **Use human-readable key names** -- `company_name` not `cName`. These become column headers.

Full patterns and examples: [output-quality.md](output-quality.md)

## Critical Reminders

1. **Register in tsconfig.base.json** -- Add `"@activepieces/piece-<name>": ["packages/pieces/community/<name>/src/index.ts"]` to `compilerOptions.paths` (alphabetically). Build fails without this.
2. **Action names are permanent** -- The `name` field in `createAction`/`createTrigger` must never change after publishing.
3. **Export auth from index.ts** -- Actions and triggers import auth via `import { myAppAuth } from '../../'`.
4. **Always provide sampleData** on triggers -- Even if it's just `{}`.
5. **Table-ready output** -- Every action output must be flat and directly mappable to spreadsheet columns. See [output-quality.md](output-quality.md).

## When to Ask the User

Always pause and ask if:
- OAuth2 authUrl/tokenUrl/scopes are not found in API docs
- Auth method is unclear or undocumented
- More than 10 possible actions exist -- ask which to prioritize
- API uses webhook signature verification
- You need test credentials or sandbox access
