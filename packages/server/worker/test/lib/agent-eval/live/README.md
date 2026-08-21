# Live failure-mode harness

The replay harness (`../`) runs the agent with **mocked** tools — great for prompt-behavior
regressions, blind to how the agent actually *uses pieces*. This harness runs the agent
**live**: real discovery, real property resolution, and (where a connection exists) real
execution, then tags each conversation with the failure modes the agent struggles with.

It exists to produce the **baseline scorecard** for the harness-improvement work (collapse the
discovery chain, fix input comprehension, fix loop memory) and to re-measure after each fix.

## How it works

1. Drives the api-key-guarded eval endpoint `POST /v1/chat/eval/turn/start` with
   `executeTools: true` (added for this harness — dry-run stubs every tool, which hides
   piece-use behavior), one scenario at a time.
2. Polls `GET /v1/chat/eval/conversations/:id/state` until the turn settles.
3. Reduces the persisted `uiMessages` (tool-call parts + action receipts) into a scorecard via
   the pure `tagger.ts` (no log-file dependency).

## Metrics

Per scenario and aggregated: tool calls, **hops before first execute**, executed/succeeded,
**gave-up** (expected an execution, none succeeded), **bad-arg rejections** (`❌ Cannot run
action …`), auth/connection-blocked, **breaker hits** (`✋`), and **schema re-fetches**
(same `ap_get_piece_props`/`ap_prepare_action` piece+action fetched again = the agent forgot).
Results are grouped by input **shape** (well-specified / dynamic-dropdown / dynamic-schema /
opaque-json / implicit-semantics / multi-piece) so you can see which input kinds the harness
handles vs. fumbles.

## Running

Prerequisites:
- The dev backend running in **EE** on Postgres, port 3000 (see memory `ee-local-dev-chat`).
- A chat provider configured in platform admin settings (the OpenRouter key).
- `AP_API_KEY` set in `.env.dev` (the npm script sources it).
- For real *execution* (not just discovery), at least one project with connections for the
  target pieces. With no connection the agent still does real discovery and hits the connection
  picker — that signal is still captured (auth-blocked, hops, schema-refetches).

```bash
npm run chat-evals:live                       # all scenarios → results/baseline.{json,md}
npm run chat-evals:live -- --only=slack-send-message,http-json-post
npm run chat-evals:live -- --label="after fix1" --out=packages/server/worker/test/lib/chat-eval/live/results/after-fix1
```

Then diff `results/baseline.md` against the post-fix scorecard. Inspect a specific run end-to-end
with `npm run chat:logs -- <conversationId>`.

> ⚠️ `executeTools:true` performs **real side effects** against the platform owner's connections
> (sends messages, creates records). Run it on a dev instance with throwaway/test connections.
