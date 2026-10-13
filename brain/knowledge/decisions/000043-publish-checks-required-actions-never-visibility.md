---
status: accepted
---

# Publish checks required actions, never visibility

## Decision
A piece set's **required actions** are checked on every publish (`LOCK_AND_PUBLISH`), on the server and in the builder. What the set **hides** is still not checked at publish: a flow that uses a hidden piece, trigger or action publishes and runs.

## Context
Embed vendors need every published flow to contain their own app's actions. Piece sets already hide items in the builder, but an API call or an import can still use a hidden item. Zapier Enterprise and Power Platform both block publishing on hidden items; we looked at doing the same in the same hook.

## Why
Checking visibility at publish would be a functional breaking change: flows that publish today would start failing after the upgrade, and the rule has no escape for flows built before a piece was hidden. Required actions are new, so checking them breaks nothing. Rejected: enforcing both in one release.

## Consequences
The trigger limit ("users can only start from these triggers") holds in the builder only. Published flows keep running when a rule changes; the rule applies at the next publish. Approval (`flowApprovalRequestService.approve`) does not check again. A required action that is not in the latest piece version is ignored, so a piece update never locks users out.
