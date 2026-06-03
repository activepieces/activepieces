# Error handling, retries & scale

Activepieces' error surface is deliberately small — you design around it.

## Built-in per-step toggles

Every action exposes two:
- **`continueOnFailure`** — don't halt the flow if this step fails.
- **`retryOnFailure`** — auto-retry the step a few times (no configurable backoff).

Default is neither: **a failing step halts the run**, preserving prior step outputs so it can be resumed. That default is usually right. **Don't reflexively set `continueOnFailure` everywhere** — only when the failure is genuinely tolerable (e.g. one fan-out channel failing shouldn't kill the whole run).

## The HTTP piece is special — and has a trap

`@activepieces/piece-http`'s `send_request` exposes its own `failureMode` (piece-specific, not platform-wide):

```
retry_all      retry on any error (4xx, 5xx)
retry_5xx      retry on server errors only
retry_none     never retry
continue_all   continue the flow on any error
continue_4xx   continue on client errors only
continue_none  stop the flow on error   (DEFAULT)
```

**The shape-change trap:** with a `continue_*` mode, a *failed* request returns a **different output shape** than a success — so `{{step_N.body}}` can silently resolve to empty after a failure. Always gate on a success indicator after a continue-on-fail HTTP step, and confirm both shapes with `ap_test_step`:

```
ROUTER: EXISTS {{step_N.body}} → success branch | Otherwise → failure branch
```

## Categorize failures — don't blanket-catch

Route on the response status rather than swallowing every error:
- **4xx (not 429)** — bad data; retrying won't help. Log/alert, don't retry.
- **429** — rate limited; back off and retry.
- **5xx** — service down; retry with a cap, then fail/alert.
- **timeout / network** — transient; retry once, then dead-letter.

## Dead-letter queue (roll your own)

There's no built-in DLQ. Make a Tables table `failed_events` (`event_id`, `flow_name`, `step_name`, `error`, `payload`, `failed_at`). After a *tolerated* external write, route on failure and `ap_insert_records` the failure row. A separate scheduled flow reads it, alerts a digest, and offers a retry path.

## Resuming a halted run

If you leave `continueOnFailure` off, the run halts at the failing step with earlier outputs intact. Resume with `ap_retry_run`:
- **`FROM_FAILED_STEP`** — resume at the failure point, reusing prior outputs (cheap).
- **`ON_LATEST_VERSION`** — re-run from the start against the currently published flow.

## Human-in-the-loop / approvals

Approval actions (Slack request-approval, Gmail request-approval, the Todos "create and wait") pause until a human decides.
- They **block indefinitely** — no built-in timeout. (Paused time does **not** count against the 600 s runtime budget.)
- The return value is the decision, but its **exact shape varies by piece** (an `approved` boolean, or a `status` like `Accepted`/`Rejected`) — **always verify with `ap_test_step`** before routing on it.
- For anything real, decide four things up front: **who** approves, **what** they see, what happens on **timeout**, where it **escalates**. AP gives none of these automatically.
- Implement a timeout with a separate scheduled "kill-switch" flow, or better, pre-score with AI and only escalate borderline cases (`ap_get_guide(ai)`).

## Scale & decomposition — the 600 s ceiling

A run gets ~600 s of **active** execution (Wait/Delay/Approval pauses don't count). Split a flow when it risks the ceiling or gets unwieldy (>~25 steps, >2 nesting levels, a memory-heavy branch, or a loop over hundreds of items):
- **Free path:** child flows with webhook triggers; the parent's last step POSTs to the child (fire-and-forget — so the child must be idempotent). Each child gets its own 600 s budget.
- **Sub Flows piece:** synchronous call with a return value (may require a specific plan/license — confirm availability before recommending).
- **Chunk big loops:** loop over chunks of N in the parent, dispatch each chunk to a child flow.
