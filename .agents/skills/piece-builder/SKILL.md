---
name: piece-builder
description: Builds Activepieces pieces (integrations) with actions and triggers. Use when the user asks to create a new piece, add actions to a piece, add triggers to a piece, or build an integration for a third-party app. Also use when the user mentions Activepieces pieces, connectors, or integration development.
---

# Activepieces Piece Builder

Build pieces (integrations) for the Activepieces automation platform. Each piece provides **actions** (operations users can perform) and **triggers** (events that start flows).

## Pick your task mode first

Most of the time you're not building a whole piece from scratch — you're adding to or fixing an existing one. Each mode uses a different slice of this skill, so figure out which you're in before diving in:

| Mode | What you're doing | Where to go |
|---|---|---|
| **New piece** | Building an integration for an app that has no piece yet | Full 5-step workflow below |
| **Add action / trigger** | An existing piece needs another operation or event | Skip Steps 1–3. Open the existing piece, **match its conventions** (its `common/` helpers, auth access, file naming, error handling), then jump to Step 4 IMPLEMENT for the new file and Step 5 WIRE & VERIFY. **Bump the piece version** — see Versioning below |
| **Fix a bug** | An existing action/trigger misbehaves | Reproduce → read the offending file *and its `common/` helpers* → make the smallest fix that matches surrounding style → Step 5 VERIFY (build + lint). Skip research/scaffold entirely. **Bump the piece version** — see Versioning below |

The golden rule for the two "existing piece" modes: **the piece you're editing is the source of truth, not these templates.** If the piece already has a `myAppApiCall` helper, a `PiecePropValueSchema`-typed auth, or a particular way of shaping output, follow *that* — consistency within a piece matters more than matching the examples here. Reach into the reference files only for a pattern the piece doesn't already demonstrate.

And whenever you change an existing piece, you also **bump its version** — that's how flows pick up your change. See the **"Versioning an existing piece"** section below.

## Workflow (new piece)

Follow these 5 steps when building a piece from scratch:

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

The CLI create commands (`npm run cli pieces create`, `actions create`, `triggers create`) are **fully interactive** — they prompt for every field through arrow-key menus and accept no command-line flags. That makes them reliable for a human at a terminal but a trap for an automated agent: with no TTY the process hangs waiting on stdin. So the path you pick depends on who's driving.

#### Option A: Copy an existing piece (fastest, deterministic — prefer this)

The quickest robust scaffold is to clone a small existing piece and rename it. You get a known-good `package.json`, `tsconfig.json`, `tsconfig.lib.json`, and `.eslintrc.json` for free, then replace the source:

```bash
cp -r packages/pieces/community/stripe packages/pieces/community/<name>
rm -rf packages/pieces/community/<name>/{node_modules,dist,src/lib}
mkdir -p packages/pieces/community/<name>/src/lib/{actions,triggers,common}
```

Then edit `package.json` (name, version `0.0.1`, dependencies) and write `src/index.ts` plus your action/trigger files. This skips all interactive prompts and never hangs.

#### Option B: Write the files by hand

Create this structure under `packages/pieces/community/<name>/`:

```
src/
  index.ts
  lib/
    actions/            # One file per action
    triggers/           # One file per trigger
    common/             # Shared helpers (optional)
package.json
.eslintrc.json
tsconfig.json
tsconfig.lib.json
```

There is **no `project.json`** — pieces are plain npm workspace packages driven by `package.json` + the two tsconfigs. Templates below (copy the two tsconfigs verbatim from any community piece if you prefer):

**package.json** — `main`, `types`, and the `build`/`lint` scripts are required; without them the piece won't compile or lint. The three `@activepieces/*` workspace deps and `tslib` are always needed.

```json
{
    "name": "@activepieces/piece-<name>",
    "version": "0.0.1",
    "main": "./dist/src/index.js",
    "types": "./dist/src/index.d.ts",
    "scripts": {
        "build": "tsc -p tsconfig.lib.json && cp package.json dist/",
        "lint": "eslint 'src/**/*.ts'"
    },
    "dependencies": {
        "@activepieces/pieces-common": "workspace:*",
        "@activepieces/pieces-framework": "workspace:*",
        "@activepieces/shared": "workspace:*",
        "tslib": "2.6.2"
    }
}
```

Add any third-party SDK to `dependencies` with a pinned version (e.g. `"stripe": "18.2.1"`).

**`.eslintrc.json`**

```json
{
    "extends": ["../../../../.eslintrc.json"],
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

The reference files are deep dives. Reading all of them every time is slow and usually unnecessary — the condensed rules already in this SKILL.md (the **Quick Auth Reference**, **Quick Piece Definition Template**, **UX Quality**, and **Output Quality** sections below) are the working contract and cover the common case. Open a reference file only when you're actually building the pattern it describes and need a concrete, copy-ready example:

| When you reach for it                                          | Open this file        |
| ------------------------------------------------------------- | --------------------- |
| Wiring auth beyond the Quick Auth Reference table             | `auth-patterns.md`    |
| Your first action in this piece (full file shape)             | `action-patterns.md`  |
| A trigger — polling, webhook, handshake, or renewal           | `trigger-patterns.md` |
| A prop type you haven't used (dropdowns, dynamic, arrays)     | `props-patterns.md`   |
| Shared API helper, pagination, or `createCustomApiCallAction` | `common-patterns.md`  |
| An advanced UX pattern (source selectors, AWS-style auth)     | `ux-guidelines.md`    |
| Flattening a deeply nested API response                       | `output-quality.md`   |
| Tagging an action/trigger for AI agents                       | `ai-metadata.md`      |

The **UX Quality** and **Output Quality** rules below are non-negotiable for every action and trigger — a piece that asks users to paste raw IDs or returns nested JSON is a broken piece. But the summaries here are enough to apply them; only open `ux-guidelines.md` / `output-quality.md` for the specific advanced pattern you're implementing.

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
    **Build fails without this step.** (New pieces only — an existing piece is already registered.)
-   [ ] **Editing an existing piece? Bump its `version` in `package.json`** per semver — see the **"Versioning an existing piece"** section. Adding an action/trigger is usually MINOR; a bug fix is usually PATCH.

#### Build and lint

```bash
bun install
npx turbo run build --filter=@activepieces/piece-<name>
npx turbo run lint --filter=@activepieces/piece-<name>
```

`bun install` is required for new pieces so the workspace symlinks are created before TypeScript can resolve imports. Skip it on subsequent rebuilds.

**Both build and lint must pass** — lint is not optional. Pieces routinely fail CI on unused imports, `any` types, and unused variables that compile fine but the ESLint config rejects. Fixing them after the fact is slower than running lint now.

Fix TypeScript errors and rebuild. Common causes: missing import in `src/index.ts`, missing `tsconfig.base.json` entry, accessing `context.auth` as a string for SecretText (use `context.auth.secret_text` instead — see Quick Auth Reference), missing `sampleData` on a trigger.

#### Test locally

Add to `packages/server/api/.env`:

```
AP_DEV_PIECES=<name>
```

Start the dev server (`npm start`), open `localhost:4200`, sign in with `dev@ap.com` / `12345678`, and find your piece in the flow builder.

---

## Versioning an existing piece

Pieces are published npm packages, so **every change to an existing piece needs a version bump** in its `package.json` (`"version": "MAJOR.MINOR.PATCH"`). This is how flows decide whether to adopt your change — skip it and your fix or new action effectively never ships. A brand-new piece starts at `0.0.1`; you only reason about bumps when editing one that already exists.

Pick the segment to bump by what your change does to the piece's *public surface* (its actions, triggers, props, and output attributes):

| Bump | When | Examples |
|---|---|---|
| **MAJOR** | You break existing flows | Remove an action/trigger; remove a prop (required *or* optional); add a **required** prop to an existing action/trigger; remove an output attribute; change what an existing action/trigger does |
| **MINOR** | You add capability without breaking anything | Add a new action or trigger; add an **optional** prop; add a new attribute to an output |
| **PATCH** | You fix a bug without touching the public surface | Fix incorrect behavior, error handling, a typo in a description |

Rule of thumb: **any removal is breaking, any new required prop is breaking, everything else is not.** When in doubt between two segments, prefer the higher one — under-bumping silently breaks live flows, which is far worse than a conservative bump.

Map this onto the two existing-piece modes: *Add action/trigger* is almost always a **MINOR** bump (unless the new prop you add to a shared/existing action is required → MAJOR); *Fix a bug* is a **PATCH** (unless the fix changes documented behavior → MAJOR). Source of truth: `docs/build-pieces/piece-reference/piece-versioning.mdx`.

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
  .eslintrc.json
  tsconfig.json
  tsconfig.lib.json
```

## Quick Auth Reference

In actions and triggers, `context.auth` is the resolved connection object — not a flat string. Access fields per type below:

| API Auth Method        | Activepieces Type        | Access Pattern                                                                |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| API key / Bearer token | `PieceAuth.SecretText()` | `context.auth.secret_text`                                                    |
| OAuth2                 | `PieceAuth.OAuth2()`     | `context.auth.access_token`; extra props via `context.auth.props?.['<key>']`  |
| Username + password    | `PieceAuth.BasicAuth()`  | `context.auth.username`, `context.auth.password`                              |
| Multiple fields        | `PieceAuth.CustomAuth()` | `context.auth.props.<field_name>`                                             |
| No auth needed         | `PieceAuth.None()`       | No `context.auth` available                                                   |

Inside the auth's own `validate` callback the shape is different (it receives the raw entered values — e.g. `auth` is the plain string for SecretText, the flat `{ base_url, api_key }` for CustomAuth). The patterns above apply to action/trigger `run()` only.

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
            // `auth` is the connection object, not a bare string. For SecretText read
            // auth.secret_text; for OAuth2 use auth.access_token.
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
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

## AI-Ready Metadata (Optional)

Pieces are also called by AI agents through the MCP server. Two optional fields let an action or trigger declare how it appears to agents — both are additive and change nothing for human users:

-   **`audience`** (actions only): `'human' | 'ai' | 'both'` — fence an action to one surface. Omit for "both" (the default).
-   **`aiMetadata`** (actions and triggers): `{ description?, idempotent? }` — an agent-facing tool description and a safe-retry hint.

Skip both unless you are deliberately tuning a piece for agents. Full guidance and examples: read `ai-metadata.md`

## Critical Reminders

1. **Register in tsconfig.base.json** -- Alphabetically in `compilerOptions.paths`. Build fails without this.
2. **Action names are permanent** -- The `name` field in `createAction`/`createTrigger` must never change after publishing.
3. **Export auth from index.ts** -- Actions and triggers import auth via `import { myAppAuth } from '../../'`.
4. **Always provide sampleData** on triggers -- Even if it's just `{}`.
5. **Build AND lint must pass** -- `npx turbo run build` and `npx turbo run lint`, both filtered to your piece. Lint failures (unused imports, `any`, unused vars) block CI even when the build is green.
6. **UX and Output quality are non-negotiable** -- No raw-ID props (use dropdowns), no nested-object outputs (flatten to table-ready rows). The summaries in this file are enough; reach for the reference files only for advanced patterns.
7. **Bump the version when you edit an existing piece** -- Update `package.json` `version` per semver (see the **"Versioning an existing piece"** section). Without a bump, live flows never pick up your change.

## When to Ask the User

Always pause and ask if:

-   OAuth2 authUrl/tokenUrl/scopes are not found in API docs
-   Auth method is unclear or undocumented
-   More than 10 possible actions exist -- ask which to prioritize
-   API uses webhook signature verification
-   You need test credentials or sandbox access
