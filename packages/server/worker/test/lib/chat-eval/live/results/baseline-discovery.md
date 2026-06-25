# Chat harness — failure-mode scorecard (baseline-v2-clean)

Model: `(platform default)` · mode: `discovery` · scenarios: 2

> Discovery-only run: `ap_execute_action` was neutralized (no side effects). "reached a runnable call" = the agent navigated discovery to a well-formed execute; external-API success is not measured here.

## Headline

| metric | value |
| --- | --- |
| reached/executed a call | 1/2 |
| reached a runnable call | 1/2 |
| blocked on a missing connection (not a failure) | 1 |
| stuck in discovery (never reached a call) | 0 |
| avg tool calls / scenario | 5.5 |
| avg discovery calls / scenario | 0.5 |
| avg hops before first execute | 0 |
| bad-arg rejections (total) | 0 |
| auth/connection blocked (total) | 0 |
| other tool errors (total) | 0 |
| breaker hits (✋, total) | 0 |
| schema re-fetches "forgot" (total) | 0 |
| wrong instrument (find vs list) | 0/0 graded |
| native task handled (HTTP/code) | 0/0 graded |

## By input shape

| shape | n | succeeded | avg hops | bad-args | breaker | re-fetch |
| --- | --- | --- | --- | --- | --- | --- |
| dynamic-dropdown | 1 | 0 | n/a | 0 | 0 | 0 |
| well-specified | 1 | 1 | 0 | 0 | 0 | 0 |

## Per scenario

| scenario | shape | calls | hops | ok | bad-arg | auth | ✋ | re-fetch | tool sequence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| slack-send-message | dynamic-dropdown | 10 | n/a | 🔌 | 0 | 0 | 0 | 0 | ap_list_connections → ap_select_project → ap_list_connections → ap_show_connection_picker … |
| gmail-send | well-specified | 1 | 0 | ✅ | 0 | 0 | 0 | 0 | ap_send_email |
