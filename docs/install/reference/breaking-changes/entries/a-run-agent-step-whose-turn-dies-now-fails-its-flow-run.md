---
id: a-run-agent-step-whose-turn-dies-now-fails-its-flow-run
title: "A Run Agent step whose turn dies now fails its flow run"
added: '2026-08-27'
release: 0.89.0
---

A Run Agent step whose turn died — no AI provider configured for the chosen vendor, a revoked API key, a model the provider no longer serves — used to report success. The step returned the failed agent result rather than raising it, so the step read SUCCEEDED, the run completed SUCCEEDED, and later steps acted on a payload that carried the failure inside it. Such a run is now FAILED, and the agent's error message is the step's error.

Two cases are deliberately unaffected, because the agent did produce usable output:

- A turn that finished but had a single tool call error. The agent may have recovered from it and reported on it, so those runs keep succeeding exactly as before.
- A turn that was cut short by the output limit or the run's usage budget. It still returns the work it completed, and the flow still continues.

#### What you need to do

Nothing to configure or migrate, and no new environment variable. Two things to check if either applies to you. If a flow relied on continuing past a dead agent step, tick **Continue on failure** on that step — it now takes effect, where previously the step never failed for it to apply to. If a flow branches on the agent result (a Router reading the step's `status`), that branch no longer runs when the turn dies, because the step raises instead of returning; move that handling onto the step's failure path.

If you alert on run status, expect agent flows that were silently completing on a misconfigured provider to start showing as failed. That is the misconfiguration surfacing, not new breakage.
