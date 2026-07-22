# shared

## What this codebase does

Pure-TypeScript types, Zod schemas, enums, and small utilities shared
between `server-api`, `server-worker`, `server-engine`, `web`, and every
piece in `packages/pieces/`. No runtime side-effects, no DB, no I/O.
Published to npm as `@activepieces/shared` and consumed by every other
package. Bumped in lockstep: any change here requires a version bump in
`packages/shared/package.json`.

## Auth shape

No auth surface. The package does define shared **types** and **schemas**
used by auth code in `server-api` (e.g. JWT payload shape, `Principal`,
`PlatformRole`, `ProjectMemberRole`). A weakening of one of these
schemas is a contract change everywhere it's imported.

## Threat model

This is a schema package — the threat is **weak validation**. A Zod
schema that accepts more than it should (e.g. `z.any()`, missing
`.strict()`, missing `.min()/.max()` on user-input strings) is an
upstream bug that lets bad data through every API boundary that imports
it. Type-only changes have no runtime effect; schema changes have wide
blast radius.

## Project-specific patterns to flag

- **`z.any()` / `z.unknown()` on a user-input shape.** Anywhere a schema
  describes data that originates outside the system (HTTP body, query
  string, piece input, webhook payload), `z.any`/`z.unknown` is a hole.
  Internal IPC shapes are different — `z.unknown` there is sometimes
  intentional.
- **`z.object({...})` without `.strict()` on request bodies.** Without
  `.strict()`, extra fields pass through silently — a real bug for
  schemas that drive DB writes (mass-assignment-style).
- **Zod error message that isn't an i18n key.** Project rule: every
  `.min(...)`, `.refine(...)`, `.superRefine(...)`, etc. that produces a
  user-facing message MUST pass a string that exists as a key in
  `packages/web/public/locales/en/translation.json`. Common messages
  should use the exported `formErrors` constant. Raw English sentences
  like `.min(1, "Name is required")` are violations.
- **Deprecated Zod API.** `z.nativeEnum` is deprecated in favour of
  `z.enum`. Any use of `z.nativeEnum` is a finding.
- **Missing version bump.** If a schema or type in this package changes,
  `packages/shared/package.json` MUST get a patch bump (or minor for new
  exports / behaviour changes). This is a project policy violation
  rather than a CVE, but it breaks downstream consumers.

## Known false-positives

- `BaseModelSchema` and other internal/legacy schemas describe DB rows,
  not user input. `z.object` without `.strict()` on those is fine.
- Test fixtures under `__tests__/` or `*.test.ts` may use `z.any()` to
  inject malformed data on purpose — don't flag them.
- The exported `ActivepiecesError`, `apId`, `tryCatch`, `isNil`,
  `spreadIfDefined`, `chunk`, `partition`, `unique`, `omit`, and
  `sanitizeObjectForPostgresql` helpers are the project's preferred
  primitives; their existence is the point.

## Editions

No edition split here — `shared` is consumed by all editions. There is
no `src/ee/` subtree; an `import … from "…/ee/…"` here would be a
layering bug.
