---
icon: 🧱
---

# Building Pieces

How to build, test, and publish custom pieces. Pieces are npm packages written in TypeScript; ~60% are community-contributed. Hot reload shows local changes in ~7s. Source: `docs/build-pieces/`.

## Build a piece (tutorial track)
- **Setup** — fork the repo or use GitHub Codespaces / dev container; local development setup.
- **Definition** — `npm run cli pieces create` scaffolds under `packages/pieces/community/<name>/`; `src/index.ts` exports `createPiece({ displayName, logoUrl, auth, authors, actions, triggers })`.
- **Authentication** — set `auth` via `PieceAuth` (e.g. `PieceAuth.SecretText(...)`, `PieceAuth.None()`); more forms in the auth reference.
- **Actions** — `npm run cli actions create` scaffolds an action file; define with `createAction(...)`.
- **Triggers** — `npm run cli triggers create`; three techniques: **Polling** (periodic checks), **Webhook** (single URL), **App Webhook** (OAuth subscriptions, not supported). Built with `createTrigger({ ..., type: TriggerStrategy.WEBHOOK | POLLING | APP_WEBHOOK, onEnable, onDisable, ... })`.

## Piece reference
Authentication, triggers (polling/webhook), properties + validation, flow control, persistent storage, files, external libraries, piece versioning, examples, custom API calls, output schema, i18n.

## Gotchas
- **Engine vitest needs a fresh `core-execution` dist.** Enums like `LoopBatchMode` live in `@activepieces/core-execution` and are re-exported through `@activepieces/shared`. The engine vitest config aliases `@activepieces/shared` to source, but that source pulls `core-execution` from its **dist** — so adding an enum value without rebuilding fails even the PR's own tests with `Cannot read properties of undefined (reading 'ITEMS_PER_BATCH')`. Run `npx turbo run build --filter=@activepieces/core-execution` first. CI's turbo dep graph handles this; local ad-hoc runs don't.
- **Tests that load a real piece can't run locally at all.** The piece-loader does `await import('<abs>/pieces/core/<x>/dist/src/index.js')`, and vite-node can't resolve that absolute built path → `ERR_MODULE_NOT_FOUND`, under both node and bun, even though plain `node` imports the same file fine. So `flow-with-delay.test.ts`, `flow-with-pause.test.ts` and friends fail on any dev machine and only go green in CI. Don't chase it as a bug in your change — verify piece-free logic (e.g. `flow-looping.test.ts`) locally and lean on CI for the rest.

## Sharing & misc
- **Sharing** — contribute to community, publish a community piece, or keep it private.
- **Misc** — build/bundle/publish piece, pieces CI/CD, migrate nx→turbo, migrate pieces to bundles, private fork, testing pieces, dev container, Codespaces, create a new AI provider.
