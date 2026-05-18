# deepsec

This directory holds the [deepsec](https://www.npmjs.com/package/deepsec)
config for the parent repo. Checked into git so teammates inherit
project context (auth shape, threat model, custom matchers); generated
scan output is gitignored.

Configured projects (8): `server-api`, `server-engine`, `server-worker`, `server-utils`, `web`, `shared`, `pieces-common`, `pieces-core`. See `deepsec.config.ts` for targets. `pieces/community/` is intentionally not registered.

## Setup

1. `pnpm install` — installs deepsec.
2. Add an AI Gateway / Anthropic / OpenAI token to `.env.local`. If
   you already have `claude` or `codex` CLI logged in on this
   machine, you can skip the token for non-sandbox runs (`process` /
   `revalidate` / `triage`); deepsec auto-detects and reuses the
   subscription. See
   `node_modules/deepsec/dist/docs/vercel-setup.md` after install.
3. The `data/<id>/INFO.md` briefings are already hand-curated; no
   further setup needed before running.

## Daily commands

```bash
pnpm deepsec scan       --project-id <id>
pnpm deepsec process    --project-id <id> --concurrency 5
pnpm deepsec revalidate --project-id <id> --concurrency 5 --min-severity HIGH   # cuts FP rate
pnpm deepsec export     --project-id <id> --format md-dir --out ./findings/<id>
```

`--project-id <id>` is **required** (multiple projects registered). Run a stage across all of them with a shell loop:

```bash
for id in server-api server-engine server-worker server-utils web shared pieces-common pieces-core; do
  pnpm deepsec scan       --project-id "$id"
  pnpm deepsec process    --project-id "$id" --concurrency 5
  pnpm deepsec revalidate --project-id "$id" --concurrency 5 --min-severity HIGH
done
# Optional — local-only markdown export for any project:
#   pnpm deepsec export --project-id <id> --format md-dir --out "./findings/<id>"
```

`scan` is free (regex only). `process` is the AI stage (≈$0.30/file
on Opus by default). Run state goes to `data/<id>/`.

## Adding another project

To scan another codebase from this same `.deepsec/`:

```bash
pnpm deepsec init-project ../some-other-package   # path relative to .deepsec/
```

Appends an entry to `deepsec.config.ts` and writes
`data/<id>/{INFO.md,SETUP.md,project.json}`. Open the new SETUP.md
in your agent to fill in INFO.md.

## Layout

```
deepsec.config.ts        Project list (one entry per scanned repo)
data/<id>/
  INFO.md                Repo context — checked into git, hand-curated
  project.json           Generated (gitignored)
  tech.json              Generated (gitignored)
  files/                 One JSON per scanned source file (gitignored)
  runs/                  Run metadata (gitignored)
  reports/               Generated markdown reports (gitignored)
AGENTS.md                Pointer for coding agents
.env.local               Tokens (gitignored)
```

## Docs

After `pnpm install`:

- Skill: `node_modules/deepsec/SKILL.md`
- Full docs: `node_modules/deepsec/dist/docs/{getting-started,configuration,models,writing-matchers,plugins,architecture,data-layout,vercel-setup,faq}.md`

Or browse on
[GitHub](https://github.com/vercel/deepsec/tree/main/docs).
