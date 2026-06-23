# Chat Prompt Eval

A gate for the AI Copilot chat **system prompt**. It runs fixtures live against the model, checks them with deterministic assertions + an LLM judge, and lets you review the results and decide whether a prompt change is good.

Promotion to production stays a **manual PR** — this tool only tells you whether to make it.

## Run it

```bash
npm run chat-evals          # interactive reviewer (uses cached results if present)
npm run chat-evals:ci       # non-interactive vitest gate (for scripts/CI)
```

Both load your key from `.env.dev` (`AP_OPENROUTER_PROVISION_KEY` or `OPENROUTER_API_KEY`). A provisioning key is fine — the runner mints a short-lived inference key and deletes it after.

The everyday loop is: **edit the prompt → `npm run chat-evals -- --fresh` → review → Proceed / Stop.**

## Baseline vs candidate

Every run compares two prompts per fixture:
- **baseline** = the prompt at **git HEAD** (committed)
- **candidate** = your **working-tree edits** (or a file via `--candidate`)

A clean working tree means baseline == candidate (it runs once and says "no prompt changes").

## Flags (`npm run chat-evals -- <flag>`)

| Flag | Use it when |
|---|---|
| *(none)* | Re-open the cached run instantly (runs live only if there's no cache yet). No LLM cost. |
| `--fresh` | You edited the prompt and want fresh results. |
| `--candidate <path>` | A/B an explicit prompt file instead of your working tree. |

For a non-interactive pass/fail gate (scripts/CI), use `npm run chat-evals:ci`.

## In the reviewer

- **Dashboard** — `baseline │ candidate │ Δ` per fixture (`▲ improved` / `▼ regressed` / `= same`) + judge calibration.
- **Browse fixtures** — per-check diff (flips highlighted), judge notes, and transcripts.
- **Proceed** (exit 0) / **Stop** (exit 1) — records the decision; then open your prompt PR.
- **Re-run live** — re-evaluate after another edit without leaving the tool.

## Fixtures

Regression cases live in `fixtures/*.json` — committed, so they're the team's shared definition of "good behavior". A prompt change and the fixtures that justify it should travel in one PR. Keep gating checks robust/deterministic; leave subjective quality to human review.

**To add or edit a fixture, see [`fixtures/README.md`](fixtures/README.md)** — schema, a copy-paste skeleton, and the full assertion/judge catalog.

## Artifacts

`.chat-eval/` (gitignored, local only): `last-run.json` (cache) and `decisions.json` (your Proceed/Stop log).
