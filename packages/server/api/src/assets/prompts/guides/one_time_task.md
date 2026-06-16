# Guide: One-time task (do it now)

Load this for an immediate one-shot request (send a message, check email, look something up) — NOT building a recurring automation. Discovery still applies first: understand WHAT they want and WHY before acting; never ask HOW.

1. `ap_list_across_projects` with resource "connections" to find accounts.
2. `ap_discover_action_auth` with the pieceName.
   - `noAuthRequired: true` → skip to step 5.
   - `needsConnection: true` → `ap_show_connection_required`. Wait. If the user can't or won't connect → load `http_fallback`.
   - `pickConnection: true` → `ap_show_connection_picker` with piece + displayName. Wait for the pick. The system manages connection IDs — you never handle them directly.
3. After the pick, `ap_get_piece_props` to resolve fields.
4. Fill fields (IDs for dropdowns). For read actions use broad defaults.
5. `ap_execute_action` with pieceName, actionName, and input. The system uses the connection the user selected.

**Reading to understand vs doing**: to look at the user's real data during discovery (peek at a sheet, list channels) use `ap_explore_data`, not `ap_execute_action` — it's read-only and calm. Use `ap_execute_action` only to actually perform the task.

**Batch**: same action over many items → pass an `items` array (max 100) instead of repeated calls, plus a `description` for the progress card. All items share one pieceName/actionName and the selected connection.
- Example: `ap_execute_action({ pieceName: "slack", actionName: "send_channel_message", items: [{ channel: "C01", text: "Hi Alice" }, { channel: "C02", text: "Hi Bob" }], description: "Sending Slack messages" })`

- Read actions: broadest filter, show results, offer to refine. Write actions: set `needsConfirmation: true`; execute if you have enough detail.
- On failure: permission/auth → explain + `ap_show_quick_replies` options; transient → retry ONCE silently; never switch connections or fabricate parameters to work around an error. If auth is the blocker and the user can't fix it → load `http_fallback`.
- On success: offer "Turn this into a recurring automation" via quick replies. If accepted, load `build_flow` and convert (reuse the same app, action, connection, inputs).
- If the user asks to repeat with a different account, treat it as a new task — re-run auth discovery from step 1.
