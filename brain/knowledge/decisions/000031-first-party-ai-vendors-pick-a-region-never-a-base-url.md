---
title: First-party AI vendors pick a region, never a base URL
icon: 🛡️
status: accepted
---

# First-party AI vendors pick a region, never a base URL

## Decision

The six OpenAI-compatible vendor providers (xAI, DeepSeek, Z.ai, Qwen, MiniMax, Moonshot) take
`region: 'international' | 'china'` in their config, not a base URL. `aiProviderUtils.resolveOpenAiCompatibleBaseUrl`
maps `(provider, region)` onto a hardcoded endpoint and falls back to the international host for vendors
with no China variant, so no admin input can produce a URL the repo does not already contain.

## Context

These vendors run separate China and international endpoints, so a single hardcoded host was not enough.
The first cut shipped an optional free-text `baseUrl`. Greptile then caught that only *model discovery*
went through `safeHttp.axios`: inference hands the URL to `createOpenAICompatible`, which uses the AI SDK's
own fetch and bypasses the SSRF filter entirely. A platform admin could point a provider at an internal or
cloud-metadata host and read the response back as generated text, with the stored API key attached — a read
SSRF, not blind. It matters on Cloud, where a platform admin is a customer and the server is our infrastructure.

## Why

The free-text field was never the requirement. The requirement was "reach the China endpoint", which is a
choice between two known hosts. Making it an enum removes the attack surface by construction rather than
filtering it, so the safety does not depend on every future call site remembering to use a filtered transport —
and there are two model switches (`createLanguageModel` and the piece's `buildLanguageModel`) that would each
have had to remember.

The rejected alternative was passing an SSRF-filtered `fetch` into `createOpenAICompatible`. It is strictly
more capable and would also fix `CUSTOM`, but Node's fetch will not take `safeHttp`'s `http.Agent`, so it needs
an undici connect hook or an axios shim that correctly handles streamed responses, applied in both switches.
That is a larger, riskier change than the problem being introduced here justified.

## Consequences

- Reaching a vendor through a proxy or self-hosted mirror is not possible on these providers. `AIProviderName.CUSTOM`
  remains the escape hatch for arbitrary endpoints.
- Adding a vendor region means editing `OPENAI_COMPATIBLE_VENDOR_ENDPOINTS`, not a user setting — a code change and a release.
- **`CUSTOM` still has the hole.** Its `baseUrl` is a bare `z.string()`, not even URL-validated, and its inference
  path is unfiltered. This decision does not close that; the filtered-transport work is still owed.
