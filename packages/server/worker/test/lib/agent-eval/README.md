# Chat Prompt Eval

A gate for the AI Copilot chat **system prompt**. It runs fixtures live against the model, checks them with deterministic assertions + an LLM judge, and lets you review the results and decide whether a prompt change is good.

Promotion to production stays a **manual PR** — this tool only tells you whether to make it.

## Run it

```bash
npm run agent-evals          # interactive reviewer (uses cached results if present)
npm run agent-evals:ci       # non-interactive vitest gate (for scripts/CI)
```

Both load your key from `.env.dev` (`AP_OPENROUTER_PROVISION_KEY` or `OPENROUTER_API_KEY`). A provisioning key is fine — the runner mints a short-lived inference key and deletes it after.

The everyday loop is: **edit the prompt → `npm run agent-evals -- --fresh` → review → Proceed / Stop.**

## Baseline vs candidate

Every run compares two prompts per fixture:
- **baseline** = the prompt at **git HEAD** (committed)
- **candidate** = your **working-tree edits** (or a file via `--candidate`)

A clean working tree means baseline == candidate (it runs once and says "no prompt changes").

## Flags (`npm run agent-evals -- <flag>`)

| Flag | Use it when |
|---|---|
| *(none)* | Re-open the cached run instantly (runs live only if there's no cache yet). No LLM cost. |
| `--fresh` | You edited the prompt and want fresh results. |
| `--candidate <path>` | A/B an explicit prompt file instead of your working tree. |
| `--baseline-model <id>` | Run the baseline arm on another OpenRouter model (default: the fixture model). |
| `--candidate-model <id>` | Run the candidate arm on another OpenRouter model (default: the fixture model). |
| `--limit <n>` | Run only the first `n` fixtures — try a model cheaply before the full suite. |
| `--only <ids>` | Run only these fixtures (comma-separated ids). |

For a non-interactive pass/fail gate (scripts/CI), use `npm run agent-evals:ci`.

## Compare models

```bash
npm run agent-evals -- --baseline-model anthropic/claude-sonnet-4.6 --candidate-model openai/gpt-5.2
```

Each arm is a prompt plus a model. With a clean working tree only the model differs; if the prompt changed too, the dashboard warns that the comparison mixes two variables. Model ids are OpenRouter slugs, run through the same chat turn (`runAgentTurn`), prompt, skills and tools as production chat.

The dashboard shows score and cost per arm. **Cost** is what OpenRouter reported for the agent's own calls, summed over every repeat; `—` means at least one call reported no cost. Judge cost is shown on its own line and is not counted in the comparison.

## In the reviewer

- **Dashboard** — `baseline │ candidate │ Δ` per fixture (`▲ improved` / `▼ regressed` / `= same`) + expected-label match (judge accuracy against human labels is in the CI report — see `fixtures/README.md`).
- **Browse fixtures** — per-check diff (flips highlighted), judge notes, and transcripts.
- **Proceed** (exit 0) / **Stop** (exit 1) — records the decision; then open your prompt PR.
- **Re-run live** — re-evaluate after another edit without leaving the tool.

## Fixtures

Regression cases live in `fixtures/*.json` — committed, so they're the team's shared definition of "good behavior". A prompt change and the fixtures that justify it should travel in one PR. Keep gating checks robust/deterministic; leave subjective quality to human review.

**To add or edit a fixture, see [`fixtures/README.md`](fixtures/README.md)** — schema, a copy-paste skeleton, and the full assertion/judge catalog.

## Nightly history

The nightly job runs each fixture 3 times and publishes the results JSON to `https://cdn.activepieces.com/ai/evals/runs/<utc-time>-<sha>.json` (public). The Config Console reads that prefix for its trend page.

## Artifacts

`.chat-eval/` (gitignored, local only): `last-run.json` (cache) and `decisions.json` (your Proceed/Stop log).
