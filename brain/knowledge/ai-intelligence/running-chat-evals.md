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
- **Tool changes:** the main upload also saves a hash of every tool's description and input schema. Your run compares them with your dev server's tools, prints which changed, runs the cases that use them first, and after the diff lists cases that answer a changed tool from recordings. Those results do not test your change, so use the agent bench for them.
- **Exit code:** 1 only on a clear result: a `chat-core` case where at least 80% of at least 3 runs fail, a clear regression, or a main baseline that could not be read. With no baseline at all the run ends with "Nothing to compare" and exits 0. A borderline case shows as failing in the table but never fails the run, because the agent samples like production chat (no fixed seed, no pinned provider) and two runs of the same case differ. `chat-prod-failures` failures alone never fail the run.

## Editing cases

All of these need `--dataset <name>`:

- `--steps`: list each case's steps, to pick where the replay starts.
- `--set-cut 3=4`: case 3 starts before step 4.
- `--set-target 3=ap_build_flow`: the tool case 3 is testing.
- `--record`: workspace reads that have no recording run live against the dev server and are saved to the case in PostHog. Writes never run live. Live tools are never saved.

## Gotchas

- `--upload` writes the run to PostHog as the main baseline. Only CI on main uses it, so never run it locally.
- A full run costs about $0.03 per run, which comes to cases × 5 × $0.03.
- Web and catalog reads (`LIVE_TOOLS` in `replay.ts`: web search, fetch and scrape, piece search and props, skills, tool schemas, setup guides) always run live with your branch's code and ignore their recordings, since their answer doesn't depend on the user. Every run makes real web searches. Workspace reads (flows, runs, connections, tables, dropdown options) stay recorded because the dev server doesn't have the user's data.
- A workspace read with no recording replies "unavailable" and the agent carries on. A write ends the turn when it isn't recorded or its input differs from the recording. If that write is the case's target tool, the run fails the tool-call gate; otherwise the judge grades what happened. Use `--record` to fill a missing read.
- Only tools on the read list (`READ_TOOLS` in `replay.ts`) count as reads. Any other tool is a write: it must match its recording exactly and never runs live. Add a new read-only tool there.
- Recording lookup is exact except for whitespace, the top-level card titles (`title`, `activeTitle`, `doneTitle`) and short vs full `pieceName`. A change that makes the agent reword a query or URL misses the recording.
- The tool change check only sees descriptions and input schemas. A change inside a tool's code that keeps both is not detected, and a recorded output never reflects it. The saved definitions expire with the baseline payload after 30 days; after that the run says the changes were not checked.
- Recordings the current tools no longer accept (tool gone, or its input schema rejects the recorded input) are left out of the replay and listed as stale after the summary. Re-record those cases.

## Key files

- `packages/server/worker/test/lib/evals/`: the CLI (`cli.ts`), replay, judge (`checks.ts`), live table and results browser
- `packages/server/api/src/app/ee/agent/agent-eval-controller.ts`: the dev-server routes the CLI calls (`agentEvalModule`)
