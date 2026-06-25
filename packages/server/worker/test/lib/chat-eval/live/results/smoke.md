# Chat harness — failure-mode scorecard (smoke)

Model: `(platform default)` · mode: `discovery` · scenarios: 2

> Discovery-only run: `ap_execute_action` was neutralized (no side effects). "reached a runnable call" = the agent navigated discovery to a well-formed execute; external-API success is not measured here.

## Headline

| metric | value |
| --- | --- |
| reached/executed a call | 1/2 |
| reached a runnable call | 1/2 |
| stuck in discovery (never reached a call) | 1 |
| avg tool calls / scenario | 9 |
| avg discovery calls / scenario | 1 |
| avg hops before first execute | 3 |
| bad-arg rejections (total) | 0 |
| auth/connection blocked (total) | 0 |
| other tool errors (total) | 0 |
| breaker hits (✋, total) | 0 |
| schema re-fetches "forgot" (total) | 0 |

## By input shape

| shape | n | succeeded | avg hops | bad-args | breaker | re-fetch |
| --- | --- | --- | --- | --- | --- | --- |
| dynamic-dropdown | 1 | 0 | n/a | 0 | 0 | 0 |
| opaque-json | 1 | 1 | 3 | 0 | 0 | 0 |

## Per scenario

| scenario | shape | calls | hops | ok | bad-arg | auth | ✋ | re-fetch | tool sequence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| slack-send-message | dynamic-dropdown | 13 | n/a | 🚫 | 0 | 0 | 0 | 0 | ap_list_connections → ap_select_project → ap_list_connections → ap_show_connection_picker … |
| http-json-post | opaque-json | 5 | 3 | ✅ | 0 | 0 | 0 | 0 | ap_set_phase → ap_load_guide → ap_discover_action_auth → ap_execute_action → ap_show_quick… |
