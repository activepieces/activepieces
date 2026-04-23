# Activepieces

Open-source AI-first workflow automation platform. Self-hosted or cloud. 400+ pieces. MCP support.

## Architecture (Non-Obvious Rules)

- **Multi-tenant**: Platform → Projects → Users. ALL queries MUST filter by `projectId` or `platformId`.
- **Editions**: CE (`ce`), EE (`ee`), Cloud (`cloud`) via `AP_EDITION`. EE extends CE via `hooksFactory` — **never import `src/app/ee/` in CE code**.
- **Feature gating**: `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)` on EE modules.
- **Entity registration**: New entities MUST be added to `getEntities()` in `database-connection.ts` — TypeORM does NOT auto-discover.
- **HTTP**: `POST` for all create/update mutations. `DELETE` for deletes. Never PUT/PATCH.
- **Security**: Every endpoint needs `securityAccess` config.
- **Side effects**: Separated into `*-side-effects.ts` files, called explicitly after mutations.
- **Multi-server**: Use `distributedLock`, BullMQ deduplication, or `FOR UPDATE SKIP LOCKED` for concurrent operations.
- **Managed PostgreSQL**: No custom extensions. Use `sanitizeObjectForPostgresql()` for external data.
- **Before modifying a module**: Read its `.agents/features/<name>.md` file for entities, services, and integration details.
| `.agents/features/*.md` | ~60 lines each | When Claude explores the feature | Entity schemas, services, data flows |
| `.claude/rules/` | 3-5 lines each | Every session | Critical safety checks (entity registration, data isolation, edition safety) |
| `.agents/skills/` | 30-65 lines each | When invoked | Step-by-step workflows (`/add-feature`, `/add-entity`, `/add-endpoint`) |
- **Exported types and constants must be placed at the end of the file**, after all logic (functions, hooks, components, classes, etc.). This keeps the logic front and centre when reading a file, and groups the public contract at a predictable location.

  ```ts
  // ✅ Correct
  function doSomething() { ... }

  export const MY_CONST = 'value';
  export type MyType = { ... };
  // ✅ Correct
  const businessService = () => { ... }

  export const MY_CONST = 'value';
  export type MyType = { ... };

  // ❌ Wrong — types/consts mixed in before logic
  export const MY_CONST = 'value';
  export type MyType = { ... };
  function doSomething() { ... }
  ```

## Coding Conventions

- **No `any` type** — Use proper type definitions or `unknown` with type guards
- **No type casting** — Do not use `as SomeType` to force types. If you encounter an unnecessary cast, remove it.
- **No deprecated APIs** — Before using any library method or export, check its JSDoc. If it carries a `@deprecated` tag, use the recommended replacement instead. Examples: prefer `z.enum` over `z.nativeEnum`.
- **Go-style error handling** — Use `tryCatch` / `tryCatchSync` from `@activepieces/shared`
- **Zod error messages must be i18n keys** — Every `.min()`, `.refine()`, `.superRefine()`, etc. that surfaces a user-facing message must pass a string that exists as a key in `packages/web/public/locales/en/translation.json`. For common messages (e.g. required fields) use the `formErrors` constant from `@activepieces/shared`. Add a new translation key if none fits; never use raw English sentences that are not in the translation file.
- **`@activepieces/shared` version bump** — Any change to `packages/shared` must be accompanied by a version bump in `packages/shared/package.json`: bump the **patch** version for non-breaking additions or fixes, bump the **minor** version for new exports or behaviour changes after you check if it has already been bumped in the current branch or not
- **Helper functions** — Define non-exported helpers outside of const declarations
- **Named parameters** — Always use a single destructured object parameter instead of positional arguments. This applies to every function with more than one parameter, regardless of type. It prevents mix-ups at the call site and makes future additions non-breaking.
- **File order**: Imports → Exported functions/constants → Helper functions → Types
- **Comments** — Only comment to explain *why* something is done, never *what* the code is doing. Code should be self-explanatory; comments that restate the code add noise and rot.
- **Util file exports** — When a util file exposes multiple plain functions or constants (non-React), do not export them individually. Instead, group them into a single named `const` and export that one object (e.g. `export const myUtils = { fn1, fn2 }`). Callers use `myUtils.fn1()` at the call site. **React components** in the same file should be **named exports** (e.g. `export function MyAlert()` or `export const MyAlert = …`) and imported by name — do not bundle them into a wrapper object for the sake of this rule.
- **Safe outbound HTTP (SSRF)** — For any outbound HTTP in `packages/server/{api,worker,utils}`, use `safeHttp.axios` / `safeHttp.createAxios({ ... })` from `@activepieces/server-utils`. Never use raw `fetch` or `axios.create` for URLs that come from user input, admin config, OAuth endpoints, or third-party integrations — they bypass the SSRF filter (private/loopback/metadata IPs). See `.claude/rules/safe-http.md`.

## Query Error Handling

- **Global error dialog via `meta`** — `app.tsx` has a `QueryCache.onError` handler that shows an error dialog when `query.meta?.showErrorDialog` is truthy. When adding a new `useQuery` that fetches primary page data (e.g. table rows, list data), add `meta: { showErrorDialog: true }` to the query options.
- **Do NOT add** `showErrorDialog` to minor/auxiliary queries (feature flags, piece metadata, single-item fetches, filter options, user details). These should fail silently.
- Rule of thumb: if the query failure would leave the user staring at an empty table or blank page with no explanation, it should have `meta: { showErrorDialog: true }`.

## Key Utilities (`@activepieces/shared`)

`apId()`, `tryCatch()`, `tryCatchSync()`, `isNil()`, `spreadIfDefined()`, `spreadIfNotUndefined()`, `ActivepiecesError({ code, params })`, `SeekPage<T>`, `formErrors`, `BaseModelSchema`, `chunk()`, `partition()`, `unique()`, `omit()`, `sanitizeObjectForPostgresql()`

## Testing

```bash
npm run test-unit     # Vitest: engine + shared
npm run test-api      # API integration (CE, EE, Cloud)
```
API tests: `setupTestEnvironment()` + `createTestContext(app)` → `ctx.post()`, `ctx.get()`. DB auto-cleaned between tests.

## Commands

```bash
npm start             # Setup dev + start all
npm run dev           # Frontend + backend
npm run lint-dev      # Lint with auto-fix (ALWAYS before done)
```

## Git Push

- Always prefix `git push` with `CLAUDE_PUSH=yes` to auto-approve the pre-push lint/test gate, e.g. `CLAUDE_PUSH=yes git push -u origin HEAD`.

## Pull Requests

- When creating a PR with `gh pr create`, always apply exactly one of these labels based on the nature of the change:
  - **`feature`** — new functionality
  - **`bug`** — bug fix
  - **`skip-changelog`** — changes that should not appear in the changelog (docs, CI tweaks, internal refactors, etc.)
- If the PR includes any contributions to pieces (integrations under `packages/pieces`), also add the appropriate pieces label (in addition to the primary label above):
  - **`area/third-party-pieces`** — for third-party integrations (most pieces under `packages/pieces/community/`)
  - **`area/core-pieces`** — for core pieces (under `packages/pieces/core/`)

## Database Migrations

- Before creating or modifying a database migration, **always read the [Database Migrations Playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration#database-migrations)** first. Follow its instructions for generating and structuring migrations.

## Verification

- Always run `npm run lint-dev` as part of any verification step before considering a task complete.

## White-Labeling & Edition Paths

- **All customer-facing UI must be white-labeled.** Sign-in/signup pages, email templates, logos, and any user-visible branding must use the platform's configured appearance (name, colors, logos) — never hardcode "Activepieces" in user-facing surfaces.
- **Test across all edition paths.** Every customer-facing feature must be verified on:
  - **Community Edition** (self-hosted, `AP_EDITION=ce`) — no custom branding, open-source plan
  - **Enterprise Edition** (self-hosted, `AP_EDITION=ee`) — custom branding behind `customAppearanceEnabled` flag
  - **Cloud Freemium** (`AP_EDITION=cloud`, standard plan) — always applies platform branding
  - **Cloud Self-Serve Paid** (`AP_EDITION=cloud`, upgraded plan) — same as freemium with higher limits
  - **Cloud Enterprise** (`AP_EDITION=cloud`, enterprise plan) — full feature set
- **Appearance is edition-gated.** Community always uses the default theme. Cloud always applies custom branding. Enterprise requires `platform.plan.customAppearanceEnabled`. See `packages/server/api/src/app/ee/helper/appearance-helper.ts`.
- **Feature gating pattern:** Backend uses `platformMustHaveFeatureEnabled()` middleware (returns 402). Frontend uses `LockedFeatureGuard` component and `enabled: platform.plan.<flag>` on queries.

## Useful Links

- [Database Migrations Playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration)
- [TypeORM Migrations Docs](https://orkhan.gitbook.io/typeorm/docs/migrations)
