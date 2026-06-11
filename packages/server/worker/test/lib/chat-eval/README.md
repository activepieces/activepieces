# Chat agent behavioral eval harness

Scores the chat agent's *behavior* on scripted scenarios so prompt/tool changes are measured, not guessed.

## What's here (deterministic, runs in CI)
- `chat-eval-types.ts` — `Transcript` (the tool calls + assistant text the agent produced), `ChatEvalScenario`, report types.
- `chat-eval-assertions.ts` — pure assertions over a transcript: `neverAskedForColumns`, `neverAskedHow`, `neverClaimedCutOff`, `calledBefore`, `noBuildToolBeforePhaseSet`, `reachedToolWithin`, `maxQuestionCards`, `custom`.
- `chat-eval-scenarios.ts` — seed scenarios encoding the target behaviors (enumerate-then-read, never-ask-how, just-act, phase-gating, never-cut-off, memory-recall).
- `chat-eval-assertions.test.ts` — unit tests proving the assertions on synthetic transcripts (this is what gates merges today).

## The live runner (to wire with provider creds — `CHAT_EVAL_LIVE=1`)
Not built here because it needs cloud LLM credentials. Its contract:
1. For each scenario, run the real agent loop (`executeChatAgentJob` machinery in `execute-chat-agent.ts`) with:
   - a **mocked tool-execution layer** — reuse the `vi.fn()` `executeTool`/MCP stub pattern from `chat-worker-tools.test.ts`, returning each scenario's `toolStubs` so no real pieces/DB/Redis are hit;
   - a **live LLM** (provider from env) OR a **VCR replay** keyed on `promptHash` (record once live, replay deterministically in CI).
2. Collect every tool call (name, turn, input) and assistant text into a `Transcript`.
3. Score with the scenario's `assertions`; emit an `EvalReport` stamped with `promptHash`/`toolsetHash`.
4. `compare(prev, next)` flags run-over-run regressions.

The console monitoring repo runs the same rubric dimensions over real prod transcripts (already delivered via `chat-sync-job.ts`) — in-repo gates merges, console watches drift.
