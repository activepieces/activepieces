---
id: the-ai-provider-config-endpoint-is-removed
title: "The AI provider config endpoint is removed"
added: '2026-09-16'
release: 0.92.0
---

`GET /v1/ai-providers/:provider/config` returned a provider's decrypted credentials so that an AI step running inside the engine could build the model itself and call the provider directly. AI steps no longer work that way: the worker resolves the credentials and makes the call, which is what lets Activepieces charge managed AI on what the call actually cost. Nothing in the product calls the endpoint any more, and it now returns `404`.

The route only ever accepted an engine token, so it was never reachable with a user token, an API key or from the browser. `GET /v1/ai-providers` and `GET /v1/ai-providers/:provider/models` are unchanged.

#### What you need to do

Nothing on a normal upgrade. Every flow is moved to the AI piece version that runs on the worker the first time its version is read, before it can run.

If you serve pieces from your own registry, make sure it carries the AI piece at `0.11.0` or later. A flow left on an earlier version would still try to fetch its provider credentials over this endpoint and fail.
