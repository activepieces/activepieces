---
description: Create git worktrees and briefs for building multiple Activepieces pieces in parallel
argument-hint: Piece1,Piece2,Piece3
allowed-tools: Bash, Read, Write, Edit
---

# Multi-Piece Parallel Setup

You are setting up parallel development environments for building multiple Activepieces pieces at once.

## Input

The user provided these piece names (comma-separated): $ARGUMENTS

## Steps

### Step 1: Parse and validate

Split `$ARGUMENTS` by comma. Trim whitespace from each name. For each piece name, generate:
- A **slug** (lowercase, hyphens, no spaces) — e.g. "Google Ads" → "google-ads"
- A **branch name**: `feat/piece-<slug>`
- A **worktree path**: `../piece-<slug>` (relative to the repo root)

Print the list and confirm with the user before proceeding.

### Step 2: Ensure clean state

Run:
```bash
git status --porcelain
```

If there are uncommitted changes, warn the user and ask whether to stash or abort.

### Step 3: Create worktrees

For each piece, run:
```bash
git worktree add ../piece-<slug> -b feat/piece-<slug>
```

If a branch already exists, offer to reuse it with:
```bash
git worktree add ../piece-<slug> feat/piece-<slug>
```

### Step 4: Explore the codebase ONCE

Before creating briefs, explore the Activepieces codebase and capture all the context that every session would need. This avoids each session wasting tokens re-exploring the same structure.

Gather the following and store it in a variable/string to embed into every BRIEF.md:

1. **Folder structure of an existing piece** — pick one well-built community piece (e.g. `packages/pieces/community/slack` or `packages/pieces/community/gmail`) and capture its full tree structure with `find` or `ls -R`

2. **Example index.ts** — read the `src/index.ts` of that example piece to show the auth + createPiece pattern

3. **Example action file** — read one action file from that example piece to show the createAction pattern

4. **Example trigger file** — read one trigger file from that example piece to show the createTrigger pattern

5. **tsconfig.base.json paths section** — read the relevant section showing how pieces are registered (the `compilerOptions.paths` entries)

6. **package.json of an existing piece** — to show the expected dependencies and structure

7. **The pieces directory listing** — run `ls packages/pieces/community/` to show all existing piece folder names (so the session knows what already exists)

Format all of this into a section called `## Codebase Reference` that will be embedded into every BRIEF.md.

### Step 5: Create a BRIEF.md in each worktree

For each worktree, create a file at `../piece-<slug>/BRIEF.md` containing:

1. **Piece name** and display name
2. **Codebase Reference** — the full context gathered in Step 4 (embedded directly, NOT a reference to files)
3. **API research instructions** — tell Claude in that session to:
   - Search the web for the app's REST API documentation
   - Identify auth method, base URL, available endpoints
   - Determine if webhooks are supported
4. **Build instructions** — reference the piece-builder skill:
   - Use `npm run cli pieces create` to scaffold
   - Use `npm run cli actions create` and `npm run cli triggers create`
   - Follow piece-types.md, auth-patterns.md, props-patterns.md, action-patterns.md, trigger-patterns.md, common-patterns.md, ux-guidelines.md, output-quality.md
   - Register in tsconfig.base.json
   - Build with `npx turbo run build --filter=@activepieces/piece-<slug>` and fix errors until it passes
5. **Quality reminders**:
   - Dynamic dropdowns instead of raw IDs
   - Flat, table-ready output
   - Step-by-step auth descriptions for non-technical users
   - sampleData on all triggers

Use this template for each BRIEF.md:

```markdown
# Piece Brief: <Display Name>

## Goal
Build the **<Display Name>** piece for Activepieces.

## Mode: Fully autonomous
Run all steps from start to finish WITHOUT stopping, pausing, or asking for confirmation at any point. Make your own decisions on auth type, actions, and triggers based on what the API supports. Do not present plans for approval — just build it.

**IMPORTANT: Do NOT explore the codebase.** Everything you need is in this brief. Do not read other pieces, do not browse the folder structure, do not look at tsconfig.base.json. All reference code and structure is provided below. Go straight to API research.

## Codebase Reference

<CODEBASE_REFERENCE>
(This section is auto-populated by the multi-piece command with:
- Folder structure of an existing piece
- Example index.ts showing auth + createPiece pattern
- Example action file showing createAction pattern
- Example trigger file showing createTrigger pattern
- tsconfig.base.json paths section showing how to register pieces
- package.json of an existing piece
- List of all existing piece folder names)
</CODEBASE_REFERENCE>

## Step 1: Research the API
Search the web for "<Display Name> API documentation" and identify:
- Auth method (API key, OAuth2, Basic Auth, custom)
- Base URL
- Available REST endpoints (CRUD, search, list)
- Webhook support (if any)
- Rate limits and pagination

## Step 2: Plan actions and triggers
Based on the API research, propose:
- **Auth type** for the piece
- **Actions** (most useful CRUD operations — aim for 3-6)
- **Triggers** (webhook-based if supported, otherwise polling — aim for 1-3)

Do NOT ask for confirmation. Proceed immediately to scaffolding.

## Step 3: Scaffold
```bash
npm run cli pieces create
# Name: <Display Name>
# Package: @activepieces/piece-<slug>

npm run cli actions create
# One per planned action

npm run cli triggers create
# One per planned trigger
```

## Step 4: Implement
Follow the piece-builder skill patterns:
- Piece types & categories: see piece-types.md
- Auth: see auth-patterns.md
- Actions: see action-patterns.md
- Properties & input fields: see props-patterns.md
- Triggers: see trigger-patterns.md
- HTTP client & dropdowns: see common-patterns.md
- UX: see ux-guidelines.md
- Output: see output-quality.md

## Step 5: Verify build
Run the build and make sure it succeeds with zero errors:
```bash
npx turbo run build --filter=@activepieces/piece-<slug>
```

If the build fails, fix ALL TypeScript errors and re-run the build command until it passes cleanly. Do not stop until the build succeeds with zero errors.

## Quality checklist
- [ ] Build passes with zero errors (`npx turbo run build --filter=@activepieces/piece-<slug>`)
- [ ] Dynamic dropdowns (no raw IDs for users)
- [ ] Flat, table-ready output on all actions
- [ ] Clear auth description with step-by-step setup instructions
- [ ] sampleData on all triggers
- [ ] Descriptive display names (plain language, not API jargon)
- [ ] Registered in tsconfig.base.json
```

### Step 6: Launch all sessions in separate Terminal windows

After all worktrees and briefs are created, launch each piece in its own macOS Terminal window using `osascript`. Each window runs `claude --dangerously-skip-permissions` so sessions are fully autonomous — no permission prompts.

For each piece, run an osascript command like this:

```bash
osascript -e '
tell application "Terminal"
  activate
  do script "cd \"<absolute-path-to-worktree>\" && claude --dangerously-skip-permissions '\''Read BRIEF.md and build this piece end to end. Do not stop or ask for confirmation at any point.'\''"
end tell'
```

**Important:** You must resolve `../piece-<slug>` to an absolute path first using:
```bash
WORKTREE_PATH=$(cd ../piece-<slug> && pwd)
```

Then use `$WORKTREE_PATH` in the osascript command.

Repeat for every piece. Add a 2-second `sleep` between each to avoid Terminal.app choking on rapid window creation:

```bash
# For each piece:
WORKTREE_PATH=$(cd ../piece-<slug-1> && pwd)
osascript -e "tell application \"Terminal\"
  activate
  do script \"cd '$WORKTREE_PATH' && claude --dangerously-skip-permissions 'Read BRIEF.md and build this piece end to end. Do not stop or ask for confirmation at any point.'\"
end tell"
sleep 2

WORKTREE_PATH=$(cd ../piece-<slug-2> && pwd)
osascript -e "tell application \"Terminal\"
  activate
  do script \"cd '$WORKTREE_PATH' && claude --dangerously-skip-permissions 'Read BRIEF.md and build this piece end to end. Do not stop or ask for confirmation at any point.'\"
end tell"
sleep 2

# ... repeat for all pieces
```

After running all osascript commands, print:

```
✅ Launched <N> Claude Code sessions in separate Terminal windows!

  Each window is building one piece autonomously.
  Window titles show the worktree directory name.

When all pieces are done, merge back from the main repo:
  git checkout main
  git merge feat/piece-<slug-1>
  git merge feat/piece-<slug-2>
  ...

Cleanup:
  git worktree remove ../piece-<slug-1>
  git worktree remove ../piece-<slug-2>
  ...
```

### Important notes
- Do NOT start building any piece yourself — just set up the worktrees and briefs
- Each Claude Code session in a worktree will independently research and build its piece
- The piece-builder skill is available in each session automatically
- Each Terminal window runs independently — you can arrange them however you like
- If a session finishes or errors out, you can re-run it manually from that window
