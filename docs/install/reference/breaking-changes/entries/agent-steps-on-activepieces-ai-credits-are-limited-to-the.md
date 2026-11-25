---
id: agent-steps-on-activepieces-ai-credits-are-limited-to-the
title: "Agent steps on Activepieces AI credits are limited to the models Activepieces offers"
added: '2026-09-08'
release: 0.91.0
---

The managed Activepieces AI provider used to accept any model id a flow named, because it serves the OpenRouter catalogue unfiltered and nothing checked the value server-side. The model picker only ever offered the three chat tiers, but the API took `modelName` as free text, so a flow, a saved agent, or a direct call to `POST /v1/agents/runs` could run any model OpenRouter publishes on Activepieces' own key.

An agent step, saved agent, or agent run that names a model outside the offered list now fails with a `VALIDATION` error that lists the models available to it, instead of running a model nobody selected. Bring-your-own keys are unaffected: an OpenRouter, OpenAI, Anthropic, or custom provider key can still name any model it pays for.

#### What you need to do

Nothing, if your agent steps use the model picker. If a flow, a saved agent, or an API call names a model id directly while running on Activepieces AI credits, switch it to one of the offered models or to your own provider key. The error message lists the available ids.
