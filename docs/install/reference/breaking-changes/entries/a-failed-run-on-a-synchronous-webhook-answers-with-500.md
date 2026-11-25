---
id: a-failed-run-on-a-synchronous-webhook-answers-with-500
title: "A failed run on a synchronous webhook answers with 500 instead of 408 after the full timeout"
added: '2026-09-02'
release: 0.90.0
---

A `/sync` webhook call whose flow run fails used to hold the connection open for the whole `AP_WEBHOOK_TIMEOUT_SECONDS` (30 seconds by default) and then answer `408 Request Timeout` with an empty body, no matter how quickly the run had actually failed. Nothing reported a terminal run status back to the waiting request, so the caller only ever saw the timeout fallback.

A run that ends in `FAILED`, `INTERNAL_ERROR`, `TIMEOUT`, `MEMORY_LIMIT_EXCEEDED` or `LOG_SIZE_EXCEEDED` now answers immediately with `500` and a body of `{"message": "The flow has failed and there is no response returned"}`. For `FAILED`, `INTERNAL_ERROR` and `MEMORY_LIMIT_EXCEEDED` this restores the behaviour from before 0.80.0, where they answered `500` (`TIMEOUT` answered `504` then; it is `500` now, like the rest). `LOG_SIZE_EXCEEDED` never had a response of its own in any earlier release, so it gains one here.

Between 0.80.0 and 0.85.x the same failures answered `204 No Content` rather than `408`, which many HTTP clients read as success. If you integrated against an Activepieces in that range and concluded a synchronous webhook "returns 204 when it fails", that is the behaviour being replaced.

Two cases are deliberately unchanged. A run that succeeds without reaching a Return Response step still waits out the timeout and answers `408`, exactly as it did before 0.80.0. A run blocked on credits still answers `402` before it starts.

#### What you need to do

Nothing to configure or migrate. If you have a caller or reverse proxy that treats `408` as the signal for a failed synchronous flow, or retry logic keyed on `408`, switch it to `5xx` — a failed run no longer produces a `408`, and the reply now arrives in seconds rather than after the timeout.
