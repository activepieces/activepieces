---
id: the-ai-piece-offers-only-the-named-model-tiers-for
title: "The AI piece offers only the named model tiers for Activepieces-provided AI"
added: '2026-08-04'
order: 4
release: 0.87.0
---

In the AI piece, picking the Activepieces-provided AI now lists only the named tiers (Fast, Expert, Heavy) rather than the full upstream model catalogue. Existing steps keep running on the model they already have, but that model no longer appears in the dropdown, so re-saving the step moves it onto one of the tiers.

#### What you need to do

Only if a flow uses Activepieces-provided AI on a model outside the Fast/Expert/Heavy tiers. Choose a tier the next time you edit that step.
