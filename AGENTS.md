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
- **Cross-cutting libraries live in `packages/core/*`**, ordered thin → thick: `core-utils`, `core-piece-types`, `core-formula`, `core-execution` (thin, bundleable, framework-agnostic) and `core/shared` (the one thick, app-level member — **keeps the name `@activepieces/shared`**, carries DB/EE/management schemas + heavy deps). Pieces and the engine may import the thin members but **never** `@activepieces/shared`; pieces get what they need via `@activepieces/pieces-framework`. See `.claude/rules/core-packages.md`.
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

- **npm dependencies go in the workspace that imports them, never the root `package.json`** — every workspace (api, worker, web, each piece, …) must declare what its own code imports, in its own `package.json` (`dependencies` for runtime imports, `devDependencies` for test/tooling-only). Bun's isolated linker resolves each workspace from its own manifest, and the Docker image installs only workspace manifests — an undeclared import that "works locally" will crash the production container. Root `dependencies` is only `jsonwebtoken` (required by `docker-entrypoint.sh`); root `devDependencies` is only for repo-level tooling under `scripts/` and `tools/`. Pin exact versions like the surrounding entries, and run `bun install` afterwards so `bun.lock` stays in sync.
- **No `any` type** — Use proper type definitions or `unknown` with type guards
- **No type casting** — Do not use `as SomeType` to force types. If you encounter an unnecessary cast, remove it.
- **No deprecated APIs** — Before using any library method or export, check its JSDoc. If it carries a `@deprecated` tag, use the recommended replacement instead. Examples: prefer `z.enum` over `z.nativeEnum`.
- **Go-style error handling** — Use `tryCatch` / `tryCatchSync` from `@activepieces/shared`
- **Zod error messages must be i18n keys** — Every `.min()`, `.refine()`, `.superRefine()`, etc. that surfaces a user-facing message must pass a string that exists as a key in `packages/web/public/locales/en/translation.json`. For common messages (e.g. required fields) use the `formErrors` constant from `@activepieces/shared`. Add a new translation key if none fits; never use raw English sentences that are not in the translation file.
- **`@activepieces/shared` version bump** — Any change to `packages/core/shared` must be accompanied by a version bump in `packages/core/shared/package.json`: bump the **patch** version for non-breaking additions or fixes, bump the **minor** version for new exports or behaviour changes after you check if it has already been bumped in the current branch or not
- **Helper functions** — Define non-exported helpers outside of const declarations
- **Named parameters** — Always use a single destructured object parameter instead of positional arguments. This applies to every function with more than one parameter, regardless of type. It prevents mix-ups at the call site and makes future additions non-breaking.
- **Prefer immutable data flow** — Functions should produce data by returning it, not by mutating an array/object the caller passes in. If a helper accumulates results (logs, derived rows, computed bindings), it should build the collection locally and return it — not take a pre-allocated bag the caller will read after. Local mutation inside a function's own body is fine; mutation that crosses the function boundary is not. Build new collections with `.map` / `.filter` / `.reduce` / spread rather than in-place `push` / `splice` / property assignment when feasible.
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

This monorepo uses **turbo** (see `turbo.json`). There is no Nx — never invoke `nx` or `npx nx`.

```bash
npm start                                       # Setup dev + start all
npm run dev                                     # Frontend + backend
npm run lint-dev                                # Lint with auto-fix (ALWAYS before done)
npx turbo run lint --filter=<package>           # Lint a single package, e.g. --filter=web
npx turbo run serve --filter=web -- --mode=cloud # Run local frontend against the cloud backend
```

When running in `--mode=cloud`, do not use OAuth2 connections — the OAuth provider will redirect back to `cloud.activepieces.com` after sign-in instead of your local frontend, breaking the flow. Use API-key / basic-auth connections, or test OAuth2 against a fully local backend.

## Pull Requests

- When creating a PR with `gh pr create`, always apply exactly one of these labels based on the nature of the change:
  - **`🌟 feature`** — new functionality
  - **`🐛 bug`** — bug fix
  - **`skip-changelog`** — changes that should not appear in the changelog (docs, CI tweaks, internal refactors, etc.)
- If the PR includes any contributions to pieces (integrations under `packages/pieces`), also add the appropriate pieces label (in addition to the primary label above):
  - **`🧩 area/third-party-pieces`** — for third-party integrations (most pieces under `packages/pieces/community/`)
  - **`🧩 area/core-pieces`** — for core pieces (under `packages/pieces/core/`)
- **Always fill the "Breaking change?" section of the PR template** — tick exactly one box (the `breaking-change-check` CI job fails if it is left unedited). A change is breaking if a self-hoster or API consumer must take action: removed/renamed API fields or endpoints, dropped columns, new required fields, removed/required env vars, or default/limit/behaviour changes. If it is breaking:
  - also apply the **`⛓️‍💥 breaking-change`** label (in addition to the primary label above), and
  - add an entry to `docs/install/reference/breaking-changes.mdx` describing what changed and the action required. CI enforces that the label and the docs entry travel together.
- **Non-rollbackable migrations are a separate axis** from customer-facing breaking changes: a migration that runs destructive DDL (`DROP TABLE`/`DROP COLUMN`, `ADD ... NOT NULL` without `DEFAULT`, etc.) must set `breaking = true` on the migration class — this is the rollback-safety flag (used by `rollback-migrations.ts` and the release rollback note), enforced by `check-migration-rollback.ts`. It does **not** by itself require the `⛓️‍💥 breaking-change` label; decide that from the upgrade-impact question above.

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
