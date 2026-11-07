---
icon: 🧪
---

# Running Chat Evals

`npm run evals` replays the PostHog chat datasets against the agent on your branch, grades every run, and diffs each case against the main baseline. Nothing is uploaded unless you pass `--upload`.

## Before you run

- Start the dev server yourself. The CLI uses its MCP tools and the `/v1/agents/eval/*` routes.
  - `AP_POSTHOG_API_KEY`: reads the datasets and the baseline.

## Run

- `npm run evals`: both datasets (`chat-core`, `chat-prod-failures`), 5 runs per case.
- `npm run evals -- --dataset chat-core`: one dataset.
- `npm run evals -- --dataset chat-core --case 2 --case 5`: only those cases.
- `--repeats 1`: a quick check. `--model <id>`: another model (default `z-ai/glm-5.3`).
- `--verbose`: print every run with its transcript instead of the live table.

## Reading the result

- In a terminal a live table shows each case's title (`metadata.title` in PostHog, falling back to its check), one mark per run (✓, ✗, spinner, `·` not started), runs done, cost so far and elapsed time. A case gets its verdict as soon as the remaining runs can't change it. Outside a terminal (CI logs) it prints line by line.
- When the runs finish, a results browser opens: ↑↓ to move, Enter to open a case's runs and then a run's failure reasons and transcript, Esc to go back, a case number to jump, q to quit. The verdicts and the baseline diff print after you quit.
- **Judge:** Jev 1.14 answers each check (`EVALS_JUDGE_MODEL` overrides it) and sees the user message plus the replayed steps. P(pass) between 0.35 and 0.65 is `unclear` (`?`), never a guess. A failed check gets a one-line reason from Haiku 5.5. There is no 1–10 score.
- **Case verdict:** a `chat-core` case passes only when every run passes (pass^k, as Anthropic recommends for regression cases). Any other case passes when more than half pass. An unclear run doesn't count as a pass.
- **Case summary:** after the runs, every case gets `expected`, `happened` and `means` lines (Haiku 5.5, only for cases with a failed or unclear run), e.g. "a user hits this about 1 time in 5".
- **Diff:** each case shows `before → now` against the main baseline: `same`, `FIXED`, `REGRESSED` or `unclear`. A change counts only when at least 80% of at least 3 runs agree on both sides.
- **Exit code:** 1 only on a clear result: a `chat-core` case where at least 80% of at least 3 runs fail, or a clear regression. A borderline case shows as failing in the table but never fails the run, because the agent samples like production chat (no fixed seed, no pinned provider) and two runs of the same case differ. `chat-prod-failures` failures alone never fail the run.

## Editing cases

All of these need `--dataset <name>`:

- `--steps`: list each case's steps, to pick where the replay starts.
- `--set-cut 3=4`: case 3 starts before step 4.
- `--set-target 3=ap_build_flow`: the tool case 3 is testing.
- `--record`: tool calls that have no recording run live against the dev server and are saved to the case in PostHog.

## Gotchas

- `--upload` writes the run to PostHog as the main baseline. Only CI on main uses it, so never run it locally.
- A full run costs about $0.03 per run, which comes to cases × 5 × $0.03.
- A read with no recording replies "unavailable" and the agent carries on; a write that isn't recorded ends the turn. Neither fails the run by itself: the judge is told and grades what happened. Use `--record` to fill the gap.

## Key files

- `packages/server/worker/test/lib/evals/`: the CLI (`cli.ts`), replay, judge (`checks.ts`), live table and results browser
- `packages/server/api/src/app/ee/agent/agent-eval-controller.ts`: the dev-server routes the CLI calls (`agentEvalModule`)
