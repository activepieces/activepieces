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

## Sharing & misc
- **Sharing** — contribute to community, publish a community piece, or keep it private.
- **Misc** — build/bundle/publish piece, pieces CI/CD, migrate nx→turbo, migrate pieces to bundles, private fork, testing pieces, dev container, Codespaces, create a new AI provider.
