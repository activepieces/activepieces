---
icon: 🧪
---

# Running Chat Evals

`npm run evals` replays the PostHog chat datasets against the agent on your branch, grades every run, and diffs each case against the main baseline. Nothing is uploaded unless you pass `--upload`.

## Before you run

- Start the dev server yourself. The CLI uses its MCP tools and the `/v1/agents/eval/*` routes.
- `.env.dev` at the repo root, which the CLI loads on its own, needs:
  - `AP_API_KEY`: the same value the dev server runs with.
  - `OPENROUTER_API_KEY`, or `AP_OPENROUTER_PROVISION_KEY` to mint a temporary key per run.
  - `AP_POSTHOG_API_KEY`: reads the datasets and the baseline.

## Run

- `npm run evals`: both datasets (`chat-core`, `chat-prod-failures`), 5 runs per case.
- `npm run evals -- --dataset chat-core`: one dataset.
- `npm run evals -- --dataset chat-core --case 2 --case 5`: only those cases.
- `--repeats 1`: a quick check. `--model <id>`: another model (default `z-ai/glm-5.3`).
- `--verbose`: print every run with its transcript instead of the live table.

## Reading the result

- In a terminal a live table shows one mark per run (✓, ✗, spinner, `·` not started), runs done, cost so far and elapsed time. A case gets its verdict as soon as the remaining runs can't change it. Outside a terminal (CI logs) it prints line by line.
- Failed runs print below the table with the reason from each failed check.
- **Case verdict:** a `chat-core` case passes when at least 80% of its runs pass. Any other case passes when more than half pass.
- **Diff:** each case shows `before → now` against the main baseline: `same`, `FIXED`, `REGRESSED` or `unclear`. A change counts only when at least 80% of at least 3 runs agree on both sides.
- **Exit code:** 1 when a `chat-core` case fails or any case regresses, 0 otherwise. `chat-prod-failures` failures alone never fail the run.

## Editing cases

All of these need `--dataset <name>`:

- `--steps`: list each case's steps, to pick where the replay starts.
- `--set-cut 3=4`: case 3 starts before step 4.
- `--set-target 3=ap_build_flow`: the tool case 3 is testing.
- `--record`: tool calls that have no recording run live against the dev server and are saved to the case in PostHog.

## Gotchas

- `--upload` writes the run to PostHog as the main baseline. Only CI on main uses it, so never run it locally.
- A full run costs about $0.03 per run, which comes to cases × 5 × $0.03.
- A read with no recording, or any write that isn't recorded, stops the replay, and that run fails. Use `--record` to fill the gap.

## Key files

- `packages/server/worker/test/lib/evals/`: the CLI (`cli.ts`), replay, checks and live table
- `packages/server/api/src/app/ee/agent/agent-eval-controller.ts`: the dev-server routes the CLI calls (`agentEvalModule`)
