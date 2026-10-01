---
title: Chat search is always a real tool over the provider's own search
icon: 🔎
status: accepted
---

# Chat search is always a real tool over the provider's own search

## Decision

Without a Tavily key, chat search is still `ap_web_search`, a function tool. Its execute makes a small sub-call on the fast model with the provider's own search (Anthropic native, Google grounding, or OpenRouter's search on the managed provider) and returns the answer and its sources. Provider search is never attached to the chat model directly.

## Context

A new Cloud platform has no Tavily key. OpenRouter plugin search was switched off on every run that can edit agents, so Cloud chat effectively had no search. Native Anthropic and Google search stayed on, but they have no `execute`, so they never tainted the turn. OpenRouter has no standalone search endpoint.

## Why

Search attached to the chat model can read a page and call a write tool in the same response, before anything can taint the turn. Tainting upfront would put every write behind the confirmation gate. A real tool taints through the normal path and needs no new vendor. The alternative we rejected was a cloud-wide Exa or Parallel key: it gives full results, but it means a second vendor contract and a second billing path.

## Consequences

Each search costs one extra small model call on top of the search fee. The chat model sees an answer plus source titles and URLs, not full pages, and reads pages with `ap_fetch_url`. Flow-step agents now get search too, since `ap_web_search` is allowed on unattended runs and native tools were not.
