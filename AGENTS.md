# Activepieces — Agent Guidelines

## Repository Overview

Turborepo monorepo with `bun` as the package manager. Key packages:

- `packages/pieces/framework` — Piece SDK (`createPiece`, `createAction`, `createTrigger`, `Property`, `PieceAuth`)
- `packages/pieces/community/` — 300+ third-party integrations
- `packages/pieces/core/` — Built-in pieces (http, schedule, store, etc.)
- `packages/server/api` — Fastify backend
- `packages/server/engine` — Flow execution engine
- `packages/shared` — Canonical types shared across all packages
- `packages/web` — React + Vite frontend

## Build / Lint / Test Commands

### Package manager & orchestrator

```bash
bun install          # install dependencies
turbo run build      # build all packages
turbo run lint       # lint all packages
```

### Running tests

```bash
# All tests across all packages
turbo run test

# Tests for a specific package (run from the package directory)
bun run test

# Single test file (from package directory)
bunx vitest run path/to/file.test.ts

# Server API tests by edition (requires packages/server/api/.env.tests)
bun run test-ce      # Community Edition integration tests
bun run test-ee      # Enterprise Edition integration tests
bun run test-unit    # Unit tests

# E2E tests
npm run test:e2e     # Playwright
```

### Lint a single package

```bash
# From within the package directory:
bun run lint
bun run lint -- --fix
```

## Code Style

### Formatting (Prettier)

- **Single quotes** for strings (the only override from Prettier defaults)
- 2-space indentation, 80-char line width, semicolons, trailing commas — all Prettier defaults

### TypeScript

- TypeScript 5.5.4 with strict mode. `moduleResolution: "node"`, `target: "es2015"`, `module: "esnext"`
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- `@typescript-eslint/no-explicit-any` is a **warning**, not an error — avoid `any` but it won't block CI
- `@typescript-eslint/no-unused-vars` is a **warning**

### File structure rule (from CLAUDE.md)

**Exported types and constants must be placed at the end of the file**, after all logic.

```ts
// ✅ Correct
function doSomething() { ... }

export const MY_CONST = 'value';
export type MyType = { ... };

// ❌ Wrong — exports/types before logic
export const MY_CONST = 'value';
export type MyType = { ... };
function doSomething() { ... }
```

### Imports

- **`lodash` is banned** (ESLint error at root level) — use native JS or alternatives
- Use path aliases defined in `tsconfig.base.json` (e.g. `@activepieces/shared`, `@activepieces/pieces-framework`)
- No barrel re-exports from within a package unless it's the public `index.ts`

### Naming conventions

- Files: `kebab-case.ts`
- Variables/functions: `camelCase`
- Types/interfaces/classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants, `camelCase` for local
- Piece action names: `kebab-case` strings (e.g. `'slack-find-user-by-email'`)

### Error handling

- Throw typed errors; avoid swallowing exceptions silently
- In pieces, let errors propagate naturally — the engine handles retries and reporting

## Pieces Development

### Action pattern

```ts
import { createAction, Property } from '@activepieces/pieces-framework';
import { myAuth } from '../auth';

export const myAction = createAction({
  auth: myAuth,
  name: 'my-action-name', // kebab-case, unique within the piece
  displayName: 'Human Readable Name',
  description: 'What this action does.',
  props: {
    inputField: Property.ShortText({
      displayName: 'Field Label',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    // implementation
  },
});
```

### Trigger pattern

```ts
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const myTrigger = createTrigger({
  auth: myAuth,
  name: 'my-trigger',
  displayName: 'Human Readable Name',
  description: 'When this event occurs.',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK, // or POLLING, WEBHOOK
  sampleData: undefined,
  onEnable: async (context) => {
    /* subscribe */
  },
  onDisable: async (context) => {
    /* unsubscribe */
  },
  run: async (context) => {
    return [context.payload.body];
  },
});
```

### Auth pattern

```ts
import { PieceAuth } from '@activepieces/pieces-framework';

export const myAuth = PieceAuth.OAuth2({
  authUrl: 'https://...',
  tokenUrl: 'https://...',
  required: true,
  scope: ['read', 'write'],
});
// Also available: PieceAuth.SecretText, PieceAuth.BasicAuth, PieceAuth.CustomAuth
```

## Testing

### Framework: Vitest (not Jest)

Add `/// <reference types="vitest/globals" />` at the top of test files for piece tests.

### Piece unit test pattern

```ts
/// <reference types="vitest/globals" />

import { myAction } from '../src/lib/actions/my-action';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('myAction', () => {
  test('does the thing', async () => {
    const ctx = createMockActionContext({
      propsValue: { inputField: 'value' },
    });
    const result = await myAction.run(ctx);
    expect(result).toEqual({ ... });
  });
});
```

### Server API test pattern

```ts
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from '../../helpers/test-setup';
import { createTestContext } from '../../helpers/test-context';

let app: FastifyInstance | null = null;

beforeAll(async () => {
  app = await setupTestEnvironment();
});
afterAll(async () => {
  await teardownTestEnvironment();
});

describe('My endpoint', () => {
  it('returns 200', async () => {
    const ctx = await createTestContext(app!);
    const res = await ctx.get('/v1/my-endpoint');
    expect(res.statusCode).toBe(200);
  });
});
```

`createTestContext` provides: `ctx.get/post/put/delete()`, `ctx.user`, `ctx.platform`, `ctx.project`, `ctx.token`.

### Test file locations

- Piece tests: `packages/pieces/community/<name>/test/**/*.test.ts`
- Server unit tests: `packages/server/api/test/unit/**/*.test.ts`
- Server integration tests: `packages/server/api/test/integration/{ce,ee,cloud}/**/*.test.ts`

## Frontend (packages/web)

- Always use `cn()` from `@/lib/utils` for `className` composition (clsx + tailwind-merge). Never use template literals for class names.
- Never use negative margins (`-mt-`, `-mb-`, `-mx-`, etc.) — use `gap`, `padding`, or `space-*` utilities instead.
- Reuse existing components before creating new ones. Extend with optional props rather than creating parallel components.
- **`useEffect` rules:**
  - Do NOT use `useEffect` to derive state from props/other state — compute inline in the component body
  - Do NOT use `useEffect` to react to user interactions — use event handlers instead
  - Do NOT use `useEffect` to reset state when a prop changes — set a new `key` prop instead

## Git Conventions

- **Conventional Commits** enforced by commitlint: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, etc.
- Direct pushes to `main` are blocked by a pre-push hook
- Never commit `packages/server/api/.env` (commitlint hook blocks it)
