# Activepieces — Coding Rules

## Build System

Monorepo powered by **Turbo** + **Bun**. All commands run from the repo root.

### Common Commands

| Task | Command |
|------|---------|
| Dev (full stack) | `bun run dev` |
| Dev (backend only) | `bun run dev:backend` |
| Dev (frontend only) | `bun run dev:frontend` |
| Lint (all) | `bun run lint` |
| Lint (dev, skip pieces, with autofix) | `bun run lint-dev` |
| Test a specific package | `turbo run test --filter=<package>` |
| Test engine | `turbo run test --filter=@activepieces/engine` |
| Test server CE | `turbo run test-ce --filter=api` |
| Test server EE | `turbo run test-ee --filter=api` |
| Build all | `turbo run build` |
| Build a specific package | `turbo run build --filter=<package>` |
| E2E tests | `bun run test:e2e` |
| DB migration | `bun run db-migration` |
| Check migrations | `bun run check-migrations` |

### Turbo Filters

Use `--filter=<name>` to target a package. Common names: `web`, `api`, `worker`, `@activepieces/engine`, `@activepieces/shared`.

## File Structure

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
