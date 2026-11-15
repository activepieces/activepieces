---
title: Chat tool calls bill real cost on managed, a flat credit on own key
icon: 🧾
status: accepted
---

# Chat tool calls bill real cost on managed, a flat credit on own key

## Decision

A chat tool call that runs on the managed provider (search, image) bills only the cost OpenRouter reported, with no flat `CHAT_CREDITS_PER_TOOL_CALL` on top. A tool call on the platform's own key (Tavily, Firecrawl, fal, own AI key) keeps the flat credit. The worker records which one paid in the tool output, because persisted parts don't carry it. This narrows 000037's "tool calls stay at one credit each" for managed calls.

## Context

Managed search and image already bill their real cost through `billedLanguageModel`, so the flat credit was charging those calls twice. Own-key calls cost us nothing per call.

## Why

We considered dropping the flat credit on own-key calls too, since the customer already pays the vendor. We kept it: it's revenue we collect today, and it prices the platform and not the vendor call.

## Consequences

`chatToolBilling` has to branch on who paid. An own-key image generated through `getGeneratedImage` must not also go through `reportFixedCredits`, or it gets charged twice.
