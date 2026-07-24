---
name: piece-builder
description: Build Activepieces pieces (integrations) — new pieces, or add/fix actions and triggers on existing ones. Use when creating a connector or integration for a third-party app.
---

# Activepieces Piece Builder

Pick your mode first:
- **New piece** → full 5-step workflow below.
- **Add action/trigger** → skip steps 1-3; open the existing piece, match its conventions (its `common/` helpers, auth access, naming), implement, wire, verify. Bump version.
- **Fix a bug** → reproduce → read the file + its `common/` helpers → smallest matching fix → verify. Bump version.

**Golden rule (existing pieces):** the piece you're editing is the source of truth, not templates. Follow its existing helpers/patterns.

## New-piece workflow
1. **Research** — find the app's REST API docs, auth method (API key / OAuth2 / Basic / custom), endpoints, webhooks, base URL, pagination, rate limits.
2. **Plan** — location `packages/pieces/community/<name>/` (custom only if asked). Pick auth type; pick most useful actions (CRUD/search/list) + triggers (webhook if supported, else polling). Ask the user if OAuth2 config is unclear, >10 possible actions, or API is ambiguous.
3. **Scaffold** — `src/index.ts`, `src/lib/auth.ts` (auth ALWAYS lives here, never inline), `src/lib/actions/`, `src/lib/triggers/`, `src/lib/common/`, plus `package.json` (name `@activepieces/piece-<name>`, version `0.0.1`), `.eslintrc.json`, `tsconfig.json`, `tsconfig.lib.json`. Pin third-party SDK versions.
4. **Implement** — use the repo's reference files for copy-ready patterns (auth-patterns.md, action-patterns.md, trigger-patterns.md, props-patterns.md, common-patterns.md, ux-guidelines.md, output-quality.md, ai-metadata.md). Do NOT grep other pieces for patterns — the reference files are curated.
5. **Wire & verify** — import every action/trigger in `index.ts`, add `createCustomApiCallAction`, register in root `tsconfig.base.json` `compilerOptions.paths` **alphabetically** (build fails silently without this). Then `bun install` (new pieces), `npx turbo run build lint --filter=@activepieces/piece-<name>` — both must pass. Test locally via `AP_DEV_PIECES=<name>`.

## Auth access in run() (`context.auth` is resolved, not a flat string)
- SecretText → `context.auth.secret_text`
- OAuth2 → `context.auth.access_token`
- BasicAuth → `context.auth.username` / `.password`
- CustomAuth → `context.auth.props.<field>`
- None → no `context.auth`
(The auth's own `validate` callback gets the raw entered values instead.)

## Versioning existing pieces (required on EVERY change, or live flows never get it)
- **MAJOR**: remove action/trigger/prop; add a *required* prop; change behavior.
- **PATCH**: new action/trigger; new *optional* prop; new output field; bug fix.
- Any removal or new required prop = breaking. When in doubt, MAJOR.

## Quality bars
- **UX**: never make users type IDs (use dynamic dropdowns showing names); descriptions must teach step-by-step; plain-language display names; sensible defaults; auth descriptions include how to get the key.
- **Output**: flatten nested objects (`user.name` → `user_name`); arrays of records need consistent flat keys; single-record actions return a flat object, list actions a flat array; human-readable keys (become spreadsheet columns).
- **AI metadata (required on new actions/triggers)**: explicit `audience` ('human'|'ai'|'both') on actions; `aiMetadata { description, idempotent }` on actions, `{ description }` on triggers.

## Critical reminders
Action/trigger `name` fields are permanent (flows store them). Always provide `sampleData` on triggers (even `{}`). Lint must pass alongside build.

Full procedure in the repo: `.agents/skills/piece-builder/SKILL.md`
