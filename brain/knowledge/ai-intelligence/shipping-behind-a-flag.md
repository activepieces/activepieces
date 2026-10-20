---
icon: 🚦
---

# Shipping Behind a Flag

How to merge unfinished AI work safely, turned on only for a test group. Without this, features wait in big PRs until they are finished, which is how the cost PRs and the helper-agent PRs ended up colliding on 11 files and needing a fixed merge order.

Two shapes, and they answer different questions. Pick by asking **who decides** whether the feature is on.

| We decide, while we are still learning | The customer's plan decides |
| --- | --- |
| A rollout module: a hash bucket over a stable id | A `PlatformPlan` boolean |
| Removed when the feature goes to everyone | Lives as long as the feature does |
| Task agents, split screen, a new prompt | `chatEnabled`, `agentsEnabled`, `customAppearanceEnabled` |

**Never a new env var or system property.** Features are decided in code. An env var means a self-hoster has to find it and set it, and the feature looks enabled in the UI while being silently broken for everyone who did not.

## A test group, while we are still learning

Task agents shipped this way on 15 Oct 2026 and the gate came out on 18 Oct.

**None of it is on `main` any more**, which is the point: a rollout flag is meant to be deleted. #16574 took it out, and `taskAgentsRollout`, `isOnForConversation` and the `tasksEnabled` log field are all gone. Do not go looking for `task-agents-rollout.ts` in the tree; everything you need is below.

The whole module was this, named after the feature and owning the whole decision:

```ts
import { createHash } from 'node:crypto'
import { ApEdition, ApEnvironment } from '@activepieces/shared'

function isOnForConversation({ conversationId }: { conversationId: string }): boolean {
    if (system.get(AppSystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT) {
        return true
    }
    if (system.getEdition() !== ApEdition.CLOUD) {
        return false
    }
    return bucketOf({ conversationId }) < ROLLOUT_PERCENT
}

function bucketOf({ conversationId }: { conversationId: string }): number {
    return createHash('sha256').update(conversationId).digest().readUInt32BE(0) % 100
}

const ROLLOUT_PERCENT = 10

export const taskAgentsRollout = {
    isOnForConversation,
    ROLLOUT_PERCENT,
}
```

Four properties make it work, and each one was a test:

- **Deterministic.** Hash a stable id, so a conversation gets the same answer on every turn. A user must never see the feature appear and vanish mid-chat.
- **Cloud only.** Self-hosters never get a half-finished feature, and it needs no setup from them.
- **Always on in local dev**, so nobody has to opt in to test their own work.
- **One decision point.** Decide it once, server side, and let the result flow down. Task agents gated `tasksAvailable` in `agent-config-rpc.ts`; when it was false the server sent no `taskSystemPrompt`, so the worker built no task tools. Both of those still exist on `main`, ungated. Do not re-check a flag in three places.

Then **tag the turn log with the group**, as task agents did with a `tasksEnabled` field. Without it you cannot split cost or quality by group, which is the only reason to run a test group at all. That field went out with the gate, so add your own; there is no shared one to reuse.

Turning it off is setting `ROLLOUT_PERCENT` to 0 and deploying. There is no runtime switch, by design.

The four tests that pinned it, worth copying verbatim for your own flag:

- turns it on for about the rollout share of cloud conversations (assert within a few points of `ROLLOUT_PERCENT`, not an exact count)
- keeps the same answer for the same conversation on every turn
- keeps it off on self-hosted editions
- turns it on for every conversation in local development

## A feature the plan decides

Four places, and missing the last one is a compile error rather than a silent bug. `chatEnabled` and `agentsEnabled` are the ones to copy.

1. A boolean on `PlatformPlan`, in `platform.model.ts`.
2. An id on `FeatureFlagId`, in the same file.
3. Its default per plan, in the billing defaults.
4. **A line in `toPlatformPlanFlags`**, in `autumn-utils.ts`, mapping the `FeatureFlagId` onto the boolean. It returns the whole `PlatformPlanFlags`, so a flag added to the type and not mapped here fails to typecheck. `autumn-entitlement-flags.test.ts` covers this mapping.

Then gate on it:

- **Backend:** `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)` on the EE module. Returns 402.
- **Frontend:** `LockedFeatureGuard`, and `enabled: platform.plan.myFlag` on queries.

This is a permanent part of the product, not a rollout. Do not use it to hide unfinished work: a plan flag says "your plan does not include this", which is a lie when the real reason is that it is half built.

## Removing it

A rollout flag is finished work that nobody has deleted yet, so delete it in one PR of its own, the way #16574 did:

1. Drop the gate and call the feature directly.
2. Delete the rollout module and its tests.
3. Drop the log field once no dashboard reads it.
4. If it had a table, the migration that drops it sets `breaking = true` and leaves `down()` empty.
5. Remove the line about it from this area's page.

The cohort-table approach (a `chat_rollout_user` row per user) was tried for the 200-user chat beta and dropped on 18 Oct. Do not bring it back: it needs a migration, an entity, an admin surface and a cleanup migration, where the hash bucket needs one file and one delete.

## Gotchas

- **Hash the thing the user experiences, not the user.** Task agents bucket by conversation id, so one user can see the feature in a new chat without their older chats changing shape underneath them. Bucketing by user id is right when the feature is a durable setting rather than a per-run behaviour.
- **A rollout share is not a sample size.** 10% of conversations is a traffic share. Check how many conversations that actually is per day before trusting any comparison between the groups.
- **`ApFlagId` is a different thing.** It is the frontend's flag list served by the flags endpoint, not a feature gate for unfinished work.

## Key files

- #16574 — the worked example being removed. There is no rollout module in the tree to read, by design; it is inlined above
- `packages/server/api/src/app/ee/agent/rpc` — `agent-config-rpc.ts`, the server-side decision point a chat flag hangs off
- `packages/server/api/src/app/ee/platform/platform-plan/billing-providers` — `toPlatformPlanFlags` in `autumn-utils.ts`, the step a new plan flag is easiest to forget
- `packages/core/shared/src/lib/management/platform` — `PlatformPlan` and `FeatureFlagId` in `platform.model.ts`
- `packages/core/shared/src/lib/ee/billing` — per-plan defaults for each flag
- `packages/server/api/src/app/ee/authentication` — `platformMustHaveFeatureEnabled` in `ee-authorization.ts`
