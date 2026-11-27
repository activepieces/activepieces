---
id: ai-steps-now-consume-credits-on-your-own-api-key-too
title: "AI steps now consume credits on your own API key too"
added: '2026-09-16'
release: 0.92.0
---

`POST /v1/ai/execute` refuses to start an AI step when the platform is out of credits, whatever provider the step uses. Previously only the managed Activepieces provider was gated, so a platform that had exhausted its credits kept running AI steps as long as they used its own key.

Credits are only enforced where a billing provider is configured, so a Community self-host is unaffected.

#### What you need to do

Nothing, unless you run AI steps on your own provider key on a platform that sits at zero credits. Those steps now fail with a credits error instead of running. Top up, or raise the plan's credit allowance.
