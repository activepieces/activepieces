---
id: republishing-no-longer-restarts-polling-triggers
title: "Republishing no longer restarts polling triggers"
added: '2026-10-27'
release: 0.93.0
---

When you republish a flow and its polling trigger is unchanged (same piece, version, trigger and inputs), the trigger keeps running. `onDisable` and `onEnable` don't run, and the stored state is kept. When the piece moves to a newer version with the same inputs, only the new version's `onEnable` runs, with `context.isRepublish` set to `true`. The old version's `onDisable` doesn't run.

#### What you need to do

Nothing for official pieces. If a custom polling piece creates something outside the store in `onEnable`, such as a resource in a third-party app, save its ID in the store and reuse it when `context.isRepublish` is `true`. Otherwise each upgrade creates a second one. To reset a polling trigger with bad state, turn the flow off and on. Republishing no longer resets it.
