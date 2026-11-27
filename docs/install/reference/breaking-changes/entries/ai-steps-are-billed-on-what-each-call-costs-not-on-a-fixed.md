---
id: ai-steps-are-billed-on-what-each-call-costs-not-on-a-fixed
title: "AI steps are billed on what each call costs, not on a fixed price per model"
added: '2026-09-16'
release: 0.92.0
---

The managed Activepieces AI provider used to charge a fixed number of credits per model per step, taken from a table calibrated at roughly a thousand tokens per call. A short call was charged about right; a long one was charged the same as a short one while costing us many times more.

Every managed AI call is now billed on the dollar cost the provider reports for that call, converted at `AP_AI_CREDIT_USD_VALUE` (default `0.0005`, so one credit is a twentieth of a cent of model spend). A call on your own API key is billed a flat one credit per model call. Tool calls stay at one credit each.

This changes what the same flow costs in both directions. A short prompt on an expensive model gets much cheaper; a long document through Extract Structured Data gets dearer. The credit cost shown in the model picker and in the credits breakdown is gone, because there is no longer a fixed number to show.

A step or a chat turn on your own API key costs the same as it did: one credit, plus one per tool call. An agent still counts as one credit however many times it goes back to the model.

#### What you need to do

Nothing to configure. Self-hosters who want a different conversion rate can set `AP_AI_CREDIT_USD_VALUE` to the dollar value of one credit.
