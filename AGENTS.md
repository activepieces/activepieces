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
- **Before modifying a module**: Read its subsystem page in `brain/<area>/` (and that area's `index.md` glossary) for domain language, entities, services, and integration details.
- **Cross-cutting libraries live in `packages/core/*`**, ordered thin → thick: `core-utils`, `core-piece-types`, `core-formula`, `core-execution` (thin, bundleable, framework-agnostic) and `core/shared` (the one thick, app-level member — **keeps the name `@activepieces/shared`**, carries DB/EE/management schemas + heavy deps). Pieces and the engine may import the thin members but **never** `@activepieces/shared`; pieces get what they need via `@activepieces/pieces-framework`. See `.claude/rules/core-packages.md`.
| `brain/<area>/index.md` | 9 areas | First stop for an unfamiliar subsystem | Area glossary + list of its pages |
| `brain/<area>/*.md` | one page per subsystem | When Claude explores that subsystem | Entity schemas, services, data flows, gotchas |
| `brain/decisions/*.md` | numbered, under `decisions/` | When Claude needs the *why* behind a design | One hard-to-reverse call each |
| `.claude/rules/` | 3-5 lines each | Every session | Critical safety checks (entity registration, data isolation, edition safety) |
| `.agents/skills/` | one folder each | When invoked | Investigations, not conventions — `/debug-failed-run`, `/triage-*`, `/piece-builder`. Code shapes and conventions live in the wiki, not here. |
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
- **Comments** — Do NOT include comments in code. No inline comments, no explanatory comment blocks, no JSDoc narration. Code must be self-explanatory through naming and structure. If a *why* genuinely needs recording, put it in the commit message or PR description, not in the source.
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

<!-- craftspace:start -->
## This repo carries its own brain

Durable company context lives in `brain/` and syncs to Craftspace both ways. Read it BEFORE
answering how this project works — its decisions, vocabulary, and gotchas are already written down.

- `brain/` — the whole tree, one folder per page. `brain/area/index.md` is the page for `area`,
  and a leaf beside it is that page's child. Grep here first.
- `brain/decisions/` — numbered, one hard-to-reverse call each, newest number last. `index.md` is its own page.
- `.agents/skills/` — repeatable procedures, one folder per skill (`.claude/skills` symlinks onto it).

## Writing back

Write a markdown FILE, do not call the Craftspace `upsert_*` tools — a file rides your PR and review,
an MCP write pushes straight to the default branch. Edit the file that already covers the topic instead
of adding a near-duplicate.

**A gotcha is not a page.** Add it as a bullet under the `Gotchas` heading of the page for the feature it
bites, so whoever reads about that feature meets it in place instead of having to know it exists. Same for
any other fact about an existing feature. Start a new file only when the TOPIC is new.

Frontmatter each file understands:

```
---
title: Optional, overrides the H1
icon: 🧭
status: accepted   # decisions only
---
```

`icon:` is a single emoji and shows on the page in the web app. Keep the emoji out of the title.
<!-- craftspace:end -->

<!-- craftspace:brain-guide v7 -->

## Craftspace brain

This repo carries its own brain. Durable context lives in `brain/knowledge/` and syncs into Craftspace, so
what you write here is what the team reads there.

**Read it before you answer.** How this project works, its decisions, its vocabulary and its gotchas are
already written down. Grep `brain/knowledge/` first: it is the same context Craftspace serves over MCP, with no setup,
and current to the working tree.

- `brain/knowledge/` is the whole tree, one folder per page. `brain/knowledge/<area>/index.md` is the page for
  `<area>`, and a leaf file beside it is that page's child.
- `brain/knowledge/decisions/` holds one hard-to-reverse call per file, newest number last.

**Write back what will still help a teammate next month**, and only that: a decision and its why, a gotcha,
a procedure that worked. Skip the ephemeral, meaning flaky one-off transients, generic tooling knowledge,
and another project's facts. A learning left in your session is lost to the team.

Write a markdown FILE. Do not call the Craftspace `upsert_*` tools from this repo: a file rides your pull
request and gets reviewed, an MCP write pushes straight to the default branch and skips that review.

Pick the file by the shape of what you learned:

| What you learned | Where it goes |
| --- | --- |
| A hard-to-reverse call and its why | `brain/knowledge/decisions/<slug>.md` |
| A repeatable procedure | `brain/knowledge/<area>/<slug>.md`, written as the steps |
| A gotcha or a how-it-works fact | a bullet under `Gotchas` on the page for that feature |
| A genuinely new topic | `brain/knowledge/<slug>.md` |
| A dated one-off with nothing to teach | one line in `brain/knowledge/memory.md` |

`<slug>` is lowercase, with each run of non-alphanumeric characters collapsed to one `-`.

**A gotcha is not a page.** Add it under the `Gotchas` heading of the page for the feature it bites, so
whoever reads about that feature meets it in place instead of having to know it exists. Same for any other
fact about something that already exists. Start a new file only when the TOPIC is new.

The filename is the entry's identity, so grep `brain/knowledge/` first and edit the file that already covers the
topic. A differently named second file is a duplicate, not an update.

Frontmatter every file understands:

~~~
---
title: Optional, overrides the H1
icon: 🧭
status: accepted   # decisions only
---
~~~

`icon:` is a single emoji and shows on the page in Craftspace. Keep the emoji out of the title.

### Decisions

Only offer one when all three hold: it is **hard to reverse**, it is **surprising without context**, and
it came from a **real trade-off**. Miss any one and skip it. Easy to reverse? You will just reverse it.
Not surprising? Nobody will wonder why. No real alternative? There is nothing to record.

Title it as the claim itself, so the list reads as a set of positions:

~~~
Worker is the Sandbox
Pieces are distributed as links, resolved lazily
~~~

The body is four `## ` sections — **Decision**, **Context**, **Why** (the reasoning and the main rejected
alternative), **Consequences** — a sentence or two each. Frontmatter takes `status: accepted`, or
`proposed` while the call is still open and `superseded by <slug>` once it is not.

### Area pages

The wiki is flat and **one Area owns exactly one page**: Title Case, an emoji icon, and everything known
about that Area on it. The page is a **glossary spine**, one line per term, and any term that outgrows a
line **graduates** to its own small child page.

~~~
# Execution Runtime
Two sentences: what this Area is.

**Worker** — definition. _Avoid_: "pool" (retired alias)
**Sandbox** — definition, see *sandbox*

## Key files
- `packages/server/worker` — the run loop
~~~

Be opinionated: one canonical word per concept, every retired alias on an `_Avoid_` line. Keep each
definition to a sentence or two, saying what the thing IS rather than what it does. Only terms specific to
this company belong; general programming words do not, however often the team says them. Never mirror the
public docs, link to them.

A page backed by code ends in `## Key files`. **Directories, not files**, wherever a directory covers it,
and **never line numbers** — any edit above one silently invalidates it. Name the entry-point symbol when
there is one; it survives a file move, which no path does. Only add paths the team actually knows: a
guessed path reads as authoritative and sends the next agent to the wrong place.

Keep every write short and human, a few tight sentences or a short list, never an essay. The brain is
skimmed, not read.

<!-- /craftspace:brain-guide -->
