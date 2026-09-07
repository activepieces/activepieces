---
title: First-party AI vendors run on one hardcoded endpoint
icon: 🛡️
status: accepted
---

# First-party AI vendors run on one hardcoded endpoint

## Decision

The six OpenAI-compatible vendor providers (xAI, DeepSeek, Z.ai, Qwen, MiniMax, Moonshot) carry an
empty config and route through `OPENAI_COMPATIBLE_VENDOR_BASE_URLS`, a hardcoded map to each vendor's
international endpoint. There is no user-facing endpoint setting of any kind — no base URL, no region.

## Context

These vendors run separate China and international endpoints, so the first cut shipped an optional
free-text `baseUrl`. Greptile then caught that only *model discovery* went through `safeHttp.axios`:
inference hands the URL to `createOpenAICompatible`, which uses the AI SDK's own fetch and bypasses the
SSRF filter. A platform admin could point a provider at an internal or cloud-metadata host and read the
response back as generated text, with the stored API key attached. That was replaced by a region enum,
which closed the SSRF surface but still cost a config field, a schema in two packages, a resolver, a
form control, translation keys and a dialog branch.

## Why

The endpoint setting never earned its keep. Every defect in the change came from that one optional
field: it had to be ordered ahead of the empty schemas in the untagged `AIProviderConfig` union, and the
admin dialog's own generic branch stripped it silently before submit. Deleting the field deleted the bug
class along with the SSRF surface, and it kept exactly the code path that was verified against live keys —
international was the only endpoint ever tested.

The China platforms (`platform.moonshot.cn`, `bigmodel.cn`, DashScope Beijing) issue **separate accounts**,
not merely different URLs, so a China key would not have authenticated against the international host
regardless. `AIProviderName.CUSTOM` already exists for arbitrary OpenAI-compatible endpoints and covers
that audience without any of this machinery.

## Consequences

- A customer on a China vendor account configures it through `CUSTOM`, not through the named provider entry.
- Changing or adding an endpoint is a code change and a release, not a user setting.
- `CUSTOM` still accepts an arbitrary admin `baseUrl` on the unfiltered inference path, and its schema is a
  bare `z.string()`. This decision does not close that; the filtered-transport work is still owed.
