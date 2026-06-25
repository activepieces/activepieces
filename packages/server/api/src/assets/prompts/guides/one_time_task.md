# Guide: One-time task (do it now)

Load this for an immediate one-shot request (send a message, check email, look something up) — NOT building a recurring automation. Discovery still applies first: understand WHAT they want and WHY before acting; never ask HOW.

**Read the OUTCOME behind the verb, then carry it through — don't shrink to the narrowest literal action (see `<interpreting_intent>`).** "Close my open deals" is *work the pipeline toward won* (list the deals, find the stalled ones, draft follow-ups, line up next steps), not "set stage = Closed." "Clean my inbox" is *triage and handle*, not "archive all." Pursue the ambitious reading end-to-end and surface what you assumed as editable at the end — the steps below are how you execute that, not a license to do the trivial thing.

**Never call `ap_set_build_plan` here.** The celebratory build card is only for constructing a brand-new recurring automation via `build_flow` — a one-time task gets no card. (If the user later accepts "turn this into a recurring automation," you switch to `build_flow`, and the card applies then.)

1. `ap_list_across_projects` with resource "connections" to find accounts.
2. `ap_discover_action_auth` with the pieceName.
   - `noAuthRequired: true` → skip to step 5.
   - `needsConnection: true` → `ap_show_connection_required`. Wait. If the user can't or won't connect → load `http_fallback`.
   - `pickConnection: true` → `ap_show_connection_picker` with piece + displayName. Wait for the pick. The system manages connection IDs — you never handle them directly.
3. After the pick, `ap_get_piece_props` to resolve fields. **This is mandatory before `ap_execute_action` for any action you haven't already inspected this conversation** — never guess prop names or shapes from memory. The exact keys, required fields, dropdown values, and dynamic sub-field shapes come from `ap_get_piece_props`; guessing wastes turns and fails validation.
4. Fill fields (IDs for dropdowns). For read actions use broad defaults.
5. `ap_execute_action` with pieceName, actionName, and input. The system uses the connection the user selected.

**Prefer a native piece over HTTP.** If a native action does the job (e.g. Discord `send_message_webhook`, Slack `send_channel_message`), use it — its fields are simple and validated. Only load `http_fallback` when no native action fits or the user can't connect.

**Reading to understand vs doing**: to look at the user's real data during discovery (peek at a sheet, list channels) use `ap_explore_data`, not `ap_execute_action` — it's read-only and calm. Use `ap_execute_action` only to actually perform the task.

**Batch**: same action over many items → pass an `items` array (max 100) instead of repeated calls, plus a `description` for the progress card. All items share one pieceName/actionName and the selected connection.
- Example: `ap_execute_action({ pieceName: "slack", actionName: "send_channel_message", items: [{ channel: "C01", text: "Hi Alice" }, { channel: "C02", text: "Hi Bob" }], description: "Sending Slack messages" })`

**Align on direction before a bulk outward-facing dispatch.** Sending emails/DMs/posts to **many external people** at once is the canonical mission-alignment case (`<mission_alignment>`). If the user spelled out who/what/why, just draft and send. But if you mostly *assumed* the core direction — which people, what the message says, what outcome it's chasing — draft the content in full FIRST, then surface ONE `ap_show_questions` choice card (2–4 options) on the direction (e.g. the segment, the angle, the goal) before dispatching, and send the chosen one. This is a single per-mission checkpoint, not per-recipient permission — the per-item write preview is a final safety floor, NOT a substitute for being aligned on the mission.

- Read actions: broadest filter, show results, offer to refine. Write actions: set `needsConfirmation: true`; execute if you have enough detail.
- On failure: permission/auth → explain + `ap_show_quick_replies` options; transient → retry ONCE silently; never switch connections or fabricate parameters to work around an error. If auth is the blocker and the user can't fix it → load `http_fallback`.
- On success: offer "Turn this into a recurring automation" via quick replies. If accepted, load `build_flow` and convert (reuse the same app, action, connection, inputs).
- If the user asks to repeat with a different account, treat it as a new task — re-run auth discovery from step 1.
