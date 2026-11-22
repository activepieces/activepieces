---
icon: 🧪
---

# Running Chat Evals

`npm run evals` replays the PostHog chat datasets against the agent on your branch, grades every run, and diffs each case against the main baseline. Nothing is uploaded unless you pass `--upload`.

## Before you run

- Start the dev server yourself. The CLI uses its MCP tools and the `/v1/agents/eval/*` routes, which answer 404 unless `AP_ENVIRONMENT` is `dev`; `execute-tool` only runs tools for eval conversations. It talks to `AP_EVAL_BASE_URL` (default `http://localhost:3000/api`).
- `.env.dev` at the repo root (found from the CLI's own location, so any working directory works) or the environment needs:
  - `AP_API_KEY`: the same value the dev server runs with.
  - `OPENROUTER_API_KEY`, or `AP_OPENROUTER_PROVISION_KEY` to mint a temporary key per run.
  - `AP_POSTHOG_API_KEY`: reads the datasets and the baseline. `AP_POSTHOG_PROJECT_ID` (default `18070`) and `AP_POSTHOG_HOST` (default `https://us.posthog.com`) point it at another PostHog.
- A check at start lists every missing variable, an unreachable dev server and an `AP_API_KEY` the dev server rejects in one message, then exits. `--steps`, `--set-cut` and `--set-target` only need `AP_POSTHOG_API_KEY`; `--compare` needs nothing.

## Run

- `npm run evals`: both datasets (`chat-core`, `chat-prod-failures`), 5 runs per case.
- `npm run evals -- --dataset chat-core`: one dataset.
- `npm run evals -- --dataset chat-core --case 2 --case 5`: only those cases.
- `--repeats 1`: a quick check. `--model <id>`: another model (default `z-ai/glm-5.3`).
- `--verbose`: print every run with its transcript instead of the live table.
- `--keep`: don't delete live runs' workspace projects; each kept one prints its name and id. The next run that creates a workspace sweeps any older than 60 minutes, so look at it before then.

## Live cases

- A case with `metadata.mode: "live"` runs against real data. Each run calls `POST /v1/agents/eval/workspace`, which creates a fresh `eval-…` project and conversation and shares the base project's connections with it (the platform owner's first project, the same one replay cases run in). The run then deletes it with `DELETE /v1/agents/eval/workspace/:projectId`, also when the run throws. The server sweeps workspaces older than an hour, so a killed run doesn't leave one forever. The agent's system prompt names the workspace project.
- `metadata.seed` is created in the workspace before the user message, tables first: each `seed.tables[]` item is an `ap_create_table` input plus optional `records` (inserted with `ap_insert_records`, values sent as text, empty ones as `""`), each `seed.flows[]` item an `ap_build_flow` input (`flowName`, `trigger`, `steps`, `folderName`). Flows sharing a `folderName` are built one at a time. A seed step's `auth` may be a plain externalId, a connection display name, `{{connection:<piece>}}` or `{{connections['<name>']}}`; the harness swaps in the workspace connection's externalId, and a case whose seed needs a connection the base project lacks is skipped like a missing card connection. A seed that fails crashes the run with the reason. The judge sees the seeded ids and flow structures as the state before the turn, next to the flows after it.
- `metadata.codeChecks` is graded by code as the **code checks** gate: `noQuestionCards` (no `ap_show_questions`), `cardShown` (that card showed), `noWrites` (no call to a tool on the write list in `code-checks.ts`, nor a write action; tests, connection checks, code runs and memory are not writes), `noDeletes` (no `ap_delete_*`, delete action, `DELETE` custom API call or delete operation inside `ap_apply_flow_operations`, `ap_manage_fields` or `ap_manage_notes`). Errored calls never count. Every flow the turn changed and didn't delete must also pass `ap_validate_flow`, unless `skipFlowValidates`; a validation that errors fails the check. `ap_validate_flow` only says a step is invalid, not why, so for a piece whose connection the scripted user declined (or the case marks `none`) the harness reads the step's settings and re-checks it with `ap_validate_step_config` and a stand-in connection: a step valid that way passes, any other invalid step fails. Replay cases pass this gate.
- `metadata.answers.connections` maps a piece to the connection the scripted user picks (`none` declines). When the base project has no connection by that name or id, or its connections can't be listed, the case is skipped with the reason: it is listed in the summary, the dataset ends as "Nothing to compare" instead of passing, and `--upload` refuses to run.
- A scripted connection pick the dev server fails to save prints as a `note:` for that run.

## Reading the result

- In a terminal a live table shows each case's title (`metadata.title` in PostHog, falling back to its check), one mark per run (✓, ✗, spinner, `·` not started), runs done, cost so far and elapsed time. A case gets its verdict as soon as the remaining runs can't change it. Outside a terminal it prints line by line.
- When the runs finish, a results browser opens: ↑↓ to move, Enter to open a case's runs and then a run's failure reasons and transcript, Esc to go back, a case number to jump, q to quit. The verdicts and the baseline diff print after you quit.
- **Judge:** Jev 1.14 answers each check (`EVALS_JUDGE_MODEL` overrides it) and sees the user message plus the steps with unwrapped `ap_lazy_tool` calls and full workspace tool inputs/results (only skill, research and web reads are cut at 2,000 chars); live cases also get a "flows after the turn" block and a note that stubbed tools (`ap_test_flow` etc.) are faked. P(pass) between 0.35 and 0.65 is escalated to Sonnet 5.5, which returns pass/fail with one evidence line and may say `unclear` (`?`) only when the evidence is missing. A failed check gets a one-line reason from Haiku 5.5; `--save` stores per-check P, verdict, evidence and the judged text. There is no 1–10 score.
- **Gates:** a run passes when the judged checks (did the expected thing, honest), valid tool calls and code checks all pass. All four print per run, go into `--save`, and upload to PostHog; a baseline saved before the code checks gate existed is read with the other three.
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

- `--upload` writes the run to PostHog as the main baseline. The CLI refuses it unless HEAD is `origin/main`, the worktree is clean and `--repeats` is at least 3. Upload by hand after main changes; the evals don't run in CI.
- A full run costs about $0.03 per run, which comes to cases × 5 × $0.03.
- Web and catalog reads (`LIVE_TOOLS` in `replay.ts`: web search, fetch and scrape, piece search and props, skills, tool schemas, setup guides) always run live with your branch's code and ignore their recordings, since their answer doesn't depend on the user. Every run makes real web searches. Workspace reads (flows, runs, connections, tables, dropdown options) stay recorded because the dev server doesn't have the user's data.
- A workspace read with no recording replies "unavailable" and the agent carries on. A write ends the turn when it isn't recorded or its input differs from the recording. That stop never fails the tool-call gate, even on the case's target tool: the input passed the tool's schema, so the judge grades whether it was right. Use `--record` to fill a missing read.
- Only tools on the read list (`READ_TOOLS` in `replay.ts`) count as reads. Any other tool is a write: it must match its recording exactly and never runs live. Add a new read-only tool there.
- Recording lookup is exact except for whitespace, the top-level card titles (`title`, `activeTitle`, `doneTitle`) and short vs full `pieceName`. A change that makes the agent reword a query or URL misses the recording.
- The tool change check only sees descriptions and input schemas. A change inside a tool's code that keeps both is not detected, and a recorded output never reflects it. The saved definitions expire with the baseline payload after 30 days; after that the run says the changes were not checked.
- Recordings the current tools no longer accept (tool gone, or its input schema rejects the recorded input) are left out of the replay and listed as stale after the summary. Re-record those cases.

## Key files

- `packages/server/worker/test/lib/evals/`: the CLI (`cli.ts`), replay, judge (`checks.ts`), `evalWorkspace`, `evalSeed`, `evalCodeChecks`, `preflight`, live table and results browser
- `packages/server/api/src/app/ee/agent/agent-eval-controller.ts`: the dev-server routes the CLI calls (`agentEvalModule`)
