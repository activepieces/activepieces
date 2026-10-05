# Writing eval fixtures

Every `*.json` file in this folder is one eval case. `npm run chat-evals` loads them all,
runs the chat turn(s), and checks the result with **assertions** (deterministic) and an
**LLM judge** (rubric-based). This file is `.md`, so the loader ignores it.

> Today fixtures are hand-written — copy the skeleton below. Later, the console workbench
> will export this exact JSON from a real transcript and you'll just drop the file here.

## How to add one

1. Copy the skeleton into `fixtures/<your-id>.json`.
2. Fill in `userTurns` (what the user says) and the checks you care about.
3. `npm run chat-evals -- --fresh` → review the transcript + verdicts → adjust until it reflects *genuinely good* behavior.
4. Commit the fixture alongside the prompt change it justifies (one PR).

## Skeleton (copy-paste, valid JSON)

```json
{
    "id": "my-fixture-id",
    "description": "One line: the behavior this case pins down.",
    "kind": "regression",
    "initialMessages": [],
    "userTurns": [
        "the user's first message"
    ],
    "recordedToolCalls": [],
    "model": {
        "provider": "openrouter",
        "modelId": "anthropic/claude-sonnet-4.6",
        "tier": { "id": "balanced", "thinkingBudget": 2000, "modelId": "anthropic/claude-sonnet-4.6" }
    },
    "assertions": [
        { "type": "neverCutOff" },
        { "type": "maxQuestionCards", "n": 2 },
        { "type": "noBuildToolBeforePhaseSet" }
    ],
    "judge": [
        {
            "dimension": "plain_language",
            "rubric": "What a PASS looks like, stated precisely. Be explicit about what is and isn't allowed.",
            "expectedLabel": "pass"
        }
    ]
}
```

## Fields

| Field | Meaning |
|---|---|
| `id` | Unique slug (also the filename). |
| `description` | Human note shown in the report. |
| `kind` | `regression` = gates the build (must pass). `capability` = evaluated and reported, but doesn't hard-fail the gate (aspirational targets). |
| `initialMessages` | Prior conversation as raw model messages — usually `[]`. |
| `userTurns` | The user message(s), in order. One string per turn. |
| `recordedToolCalls` | Recorded tool outputs replayed deterministically (see below). `[]` for pure discovery cases where the model only asks/answers and calls no cross-project tools. |
| `model` | `provider` is `openrouter`; `modelId`/`tier.modelId` an OpenRouter slug; `tier.thinkingBudget` the reasoning-token budget. |
| `assertions` | Deterministic checks (table below). Keep these robust. |
| `judge` | LLM-judged quality dimensions (rubric below). |

## Assertions (deterministic — prefer these for gating)

| `type` | Params | Passes when |
|---|---|---|
| `neverCutOff` | — | The response wasn't truncated by the output-token limit. |
| `neverAskedHow` | — | No technical "how/which-field/which-trigger" clarifying question (blunt regex — it false-positives on benign "how would you like…", so use sparingly). |
| `noBuildToolBeforePhaseSet` | — | No build-only tool ran while still in the discovery phase. |
| `maxQuestionCards` | `n`, optional `toolNames[]` | At most `n` question cards shown. By default counts any tool whose name matches `question` or `quick_repl`; override with `toolNames` to count specific tools. |
| `calledBefore` | `a`, `b` | Tool `a` was called before tool `b` (fails if either never ran). |
| `reachedToolWithin` | `toolName`, `n` | `toolName` was first called at tool-call order ≤ `n`. |
| `neverCalledTool` | `toolName` | `toolName` was never called. |
| `noToolArgMatches` | `pattern`, optional `toolName` | No call (of `toolName`, if set) had arguments matching the case-insensitive regex `pattern`. Use it for hard "never sent to X" checks. |

## Judge dimensions (subjective quality)

Each is `{ dimension, rubric, expectedLabel }`. The judge reads the transcript and returns PASS/FAIL for the **rubric**; the test compares it to `expectedLabel`. Tips:
- Write the rubric as a precise PASS criterion, and **call out what is allowed** (e.g. "asking which app the user uses is fine — that's a business question, not technical") so the judge doesn't over-flag.
- `expectedLabel` is almost always `pass`. Use a `fail`-labeled dimension only to test that the judge correctly *catches* bad behavior (it feeds the "expected-label match" line, which is not judge accuracy — see Judge calibration below).
- Keep genuinely subjective/iteration-sensitive judgments in `capability` fixtures, not `regression` ones.

## recordedToolCalls (replay)

For cases where the model must call cross-project/MCP tools, record their outputs so the run is
deterministic. Each entry: `{ order, toolName, recordedInput?, output }`. The replay executor
returns `output` in `order` sequence and flags a divergence if the model calls something
unexpected. Leave `[]` for discovery-only cases.

## Judge calibration (is the judge right?)

The report's "expected-label match" only says whether the judge agreed with each fixture's `expectedLabel`. An agent miss counts there as a judge error, so it is not judge accuracy. The real number is **judge vs human labels**, measured on person-reviewed transcripts in `../calibration/`.

1. Download a nightly run: `curl -o run.json https://cdn.activepieces.com/ai/evals/runs/<file>.json`
2. `npm run agent-evals -- export-calibration run.json` writes one unlabelled case per fixture dimension into `calibration/` (existing files are kept).
3. Open each new file, read `rubric` and `transcript`, and set `"humanLabel"` to `"pass"` or `"fail"`. Add `"labelledBy": "<your name>"`. Decide on your own before looking at what the judge said. Delete cases you cannot decide.
4. Commit. Every live run re-judges all labelled cases. Person-reviewed labels give `judge vs human labels … TPR / … TNR`, the judge's accuracy. Labels marked `"labelledBy": "claude"` are model-written drafts: they only feed a separate `draft estimate` line, because they measure Claude against Claude. Reviewing a draft means checking its label and setting `labelledBy` to your name. Aim for about 40 cases with a real mix of pass and fail; with no fails, TNR stays `—`.
