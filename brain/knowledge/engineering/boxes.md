---
icon: 📦
---

# Boxes

A **box** is a cloud dev machine with Claude Code on it, made by the `box` CLI (`npm i -g @abuaboud/box`, also called `skyfleet`). Claude runs on your laptop in a git worktree whose files, builds and servers live on the box, and every port you open gets a preview link. Boxes are also how Claude gets production data: the ClickHouse logs and the read-only Postgres replica come in as MCP servers.

- Sign in once: `box login --server https://box.abuaboud.me`.
- `box new -n <name>` makes one, `box ls` lists them, `box <name>` reopens one, `box rm <name>` deletes it (unpushed work goes to `cb/<name>` first).
- `--always-on` stops it sleeping, which you want for a demo or a feedback link. `--remote` runs Claude on the box so it keeps going with the laptop shut.

## Gotchas

- **A box only checks out your branch if it is on GitHub.** `box new` reads the branch you are on, but builds the worktree from `origin/<branch>`. A local-only branch silently becomes a fresh `cb/<name>` cut from `main`, so the box shows main's code and nothing says why. Push first (`git push -u origin <branch>`).
- **The `activepieces` environment can leave `bun.lock` half-merged on a feature branch.** Its setup reapplies a stash made on `main`, so `git status` on the box shows `UU bun.lock` and `bun install` links an old dependency set (a piece build then fails with `Cannot find module 'undici'`). On the box only: `git checkout HEAD -- bun.lock && bun install`.
- **Vite rejects the preview host with 403 "Blocked request. This host is not allowed".** `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` does not help, because turbo drops env vars it does not know before they reach Vite. On the box only, set `allowedHosts: ['.on.boat.dev']` in `packages/web/vite.config.mts` (the commented line is there), and Vite reloads on its own. Also point `AP_FRONTEND_URL` in `.env.dev` at the preview URL.
- **To share a running app:** `ssh <name>.box 'preview 4200'` prints the public `https://…on.boat.dev` link. The dev database is seeded with `dev@ap.com` / `12345678`, a platform admin.
- **Never `pkill -f` from `ssh <name>.box '…'`.** The pattern also matches the remote shell running your command, so it kills itself and the call hangs. Start long processes from a script with `setsid nohup … < /dev/null &`.
- **A box restart kills the dev server and can drop Node 24.** `/tmp` and every process are gone, and the box can come back with only the system Node 20. The API then dies at boot with `TypeError [ERR_INVALID_ARG_TYPE] … promisify` in `file-compressor.ts`, because zstd needs Node 22.15+, while Vite still serves the page, so the preview shows "upstream unavailable" or API 502s. Fix on the box: `source ~/.nvm/nvm.sh && nvm install 24 && nvm alias default 24`. Start the app from a script that sources nvm first, so it survives the next restart. Repo edits in `~/repo` survive.
