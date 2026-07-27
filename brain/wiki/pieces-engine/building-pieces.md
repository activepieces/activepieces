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
- **A non-string property can reach `run()` as a JSON string.** The builder's fx / dynamic-value toggle renders a text input, so `getValueForInputOnDynamicToggleChange` (`auto-form-field-wrapper.tsx`) `JSON.stringify`s whatever was there — `["year","month"]`, `true`, a dropdown's object option value. It saves and publishes silently because `buildSchema` (`packages/pieces/framework/src/lib/property/util.ts`) deliberately unions a `z.string()` branch onto those types for exactly this reason, and that schema is what both the form and the server-side step validator use. The only place to heal it is the engine's `variables/processors/` map (`props-processor.ts` is the single choke point for actions, triggers, **and** the agent/MCP tool path). Precedent: `objectProcessor` (#5636), then multi-select + checkbox (#14389). Coercion is only safe where the property's value type is unambiguous — `DROPDOWN`/`STATIC_DROPDOWN` are deliberately excluded because a legitimate string option value like `"[1,2]"` would be corrupted into an array, so that gap is still open. Pair every new processor with a `validateProperty` case: without one, a string the processor can't parse reaches the piece with zero errors and fails opaquely deep inside `run()`. An empty dynamic input is `''`, not nil — processors must map it to `undefined` on optional props (see `textProcessor`) or an untouched optional field errors. Toggling *back* to manual is the mirror trap: that branch used to discard the value and return `getDefaultPropertyValue`, so the field silently reset to the piece's `defaultValue` (on Date Helper, `['year']`, which reads as "it kept only the first item"). Both directions now route through `piecePropertiesUtils.parseDynamicValue` (framework, beside `buildSchema`), which restores a value only when its shape is unambiguous for the property; single-select dropdowns still reset, deliberately.
- **Tests that load a real piece can't run locally at all.** The piece-loader does `await import('<abs>/pieces/core/<x>/dist/src/index.js')`, and vite-node can't resolve that absolute built path → `ERR_MODULE_NOT_FOUND`, under both node and bun, even though plain `node` imports the same file fine. So `flow-with-delay.test.ts`, `flow-with-pause.test.ts` and friends fail on any dev machine and only go green in CI. Don't chase it as a bug in your change — verify piece-free logic (e.g. `flow-looping.test.ts`) locally and lean on CI for the rest.

## Sharing & misc
- **Sharing** — contribute to community, publish a community piece, or keep it private.
- **Misc** — build/bundle/publish piece, pieces CI/CD, migrate nx→turbo, migrate pieces to bundles, private fork, testing pieces, dev container, Codespaces, create a new AI provider.
