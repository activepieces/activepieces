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
| `kind` | `regression` = gates the build (must pass). `capability` = evaluated and counts toward judge calibration, but doesn't hard-fail the gate (aspirational targets). |
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

## Judge dimensions (subjective quality)

Each is `{ dimension, rubric, expectedLabel }`. The judge reads the transcript and returns PASS/FAIL for the **rubric**; the test compares it to `expectedLabel`. Tips:
- Write the rubric as a precise PASS criterion, and **call out what is allowed** (e.g. "asking which app the user uses is fine — that's a business question, not technical") so the judge doesn't over-flag.
- `expectedLabel` is almost always `pass`. Use a `fail`-labeled dimension only to test that the judge correctly *catches* bad behavior (it feeds the TPR/TNR calibration check).
- Keep genuinely subjective/iteration-sensitive judgments in `capability` fixtures, not `regression` ones.

## recordedToolCalls (replay)

For cases where the model must call cross-project/MCP tools, record their outputs so the run is
deterministic. Each entry: `{ order, toolName, recordedInput?, output }`. The replay executor
returns `output` in `order` sequence and flags a divergence if the model calls something
unexpected. Leave `[]` for discovery-only cases.
