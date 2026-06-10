# Flow patterns (archetypes)

Match the user's idea to one of these shapes first — it tells you what to build and stops you over-engineering. Reality check: **most flows are simple.** The majority are 2–5 linear steps; schedules and forms are the most common triggers (webhooks are less common than people assume); and AI is a normal, frequent step, not exotic. Don't reach for routers/loops/state unless the shape actually needs them.

Name the pattern back to the user when you recognize it; combine names when an idea spans two.

## 1. Passthrough — trigger → action
Trigger fires, one action consumes the payload directly. No transform, no decision.
```
trigger:appA/new_x → step_1: appB/create_y  (inputs from {{trigger['output'].*}})
```
The single biggest category. If this is the whole ask, just confirm trigger + action and build — no analysis needed.

## 2. Enrich-then-act — gather context, then do one thing
Before a decision or AI step, chain read-only fetches to assemble context (each step's id feeds the next fetch). CRM flows often need 5–10 of these, not 1–2.
```
trigger → find_contact → get_company → get_deals → … → ai/decide or act
```
Explicitly list every read-only fetch needed before the first decision.

## 3. Lookup-or-create (upsert)
Find a record; if absent create it, if present thread its id forward. There's no universal "upsert" — the operator depends on the find action's output shape (verify with `ap_get_piece_props`/`ap_test_step`): `{found}` → `BOOLEAN_IS_FALSE`; `[records]` → `LIST_IS_EMPTY`; `{id}` → `DOES_NOT_EXIST`.
```
find_X → ROUTER (not found → create_X | Otherwise → optional update) → use the id downstream
```

## 4. AI-classify-then-route
AI emits a constrained label; a router branches on it. Pin the AI output to a closed set or routing is fragile (`ap_get_guide(ai)`).
```
ai/classifyText "return one of A/B/C" → ROUTER (TEXT_EXACTLY_MATCHES per label + Otherwise)
```

## 5. Score-gate with human escalation
AI scores; high auto-proceeds, low auto-rejects, only borderline goes to a human. Collapses approvals to the hard cases.
```
ai/score → ROUTER (>high auto-pass | <low reject | Otherwise → approval → route on result)
```

## 6. Approval fork
A human approves mid-flow; one router branches on the decision. Verify the approval's return shape with `ap_test_step` (it varies by piece). Approvals block indefinitely — see `ap_get_guide(error-handling)`.
```
draft/extract → approval piece → ROUTER (approved → execute | Otherwise → notify/cleanup)
```

## 7. Scheduled digest / fan-in → synthesize → fan-out
Schedule pulls from N sources, accumulates, AI synthesizes, sends to M channels. **Each output channel needs its own format conversion** (Slack mrkdwn, HTML email, Telegram) — don't pipe raw markdown into Slack.
```
schedule → [per source: list → loop → store/add_to_list] → store/get all → ai/synthesize → [per channel: format → send]
```

## 8. Idempotent / stateful event handler
A webhook (or recurring event) where you must not double-process, or where you track per-entity state across runs. Dedup gate first; Store keyed by the provider's stable id. Full patterns in `ap_get_guide(state)`.
```
webhook → store/get evt key → ROUTER (new → mark seen + process | Otherwise → exit)
```

## 9. Status-column / queue state machine
Spreadsheet- or Table-driven: a row trigger fires on every change, but a status column gates which rows do work; write the column back to advance state. The sheet/table *is* the workflow DB — cheap and user-visible.
```
sheet/row-updated → ROUTER (status == "ready" → process → set status "done" | Otherwise → exit)
```
The write-back re-fires the trigger; the status gate stops the echo (the row is no longer "ready").

---

When no pattern fits cleanly, fall back to the planning checklist: trigger → payload → end state → steps → control flow → state → failure paths → idempotency → approval → limits. Resolve those before building.
