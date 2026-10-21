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
