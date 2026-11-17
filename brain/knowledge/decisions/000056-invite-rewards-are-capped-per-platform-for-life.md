---
status: accepted
---

# Invite rewards are capped per platform for life

## Decision
A Cloud platform whose plan carries reward slots (Free, Plus and Team, monthly or annual) earns bonus credits (1,000 by default) each time an invited person joins as a new member. The plan sets how many slots there are, 4 today, and each reward is paid at most once per platform for life, so a platform never earns more rewards than the slot count, whatever plan it moves to. The same person earns a reward for each platform they join. Removing a member never frees a slot and never takes the credits back. Self-hosted installs get no invite reward.

## Context
The reward exists to push a team toward the free plan's 5 users, so the cap is 4: the owner plus four invitees. On self-hosted, credits only cap AI usage on the team's own provider keys, so a bonus there gives nothing of value, and a self-hosted server is not a trustworthy witness that someone joined.

## Why
The slots live on the plans in the billing provider, so which plans earn and how many slots they carry are plan settings, changed without a code change. Each reward is paid under a fixed number (first, second, third, fourth) that can only be paid once per platform, so a slot count that restarts on a plan change cannot pay a fifth reward. Inviting 4 people, collecting the credits, removing them and inviting 4 more must not earn more than 4 rewards, so the cap counts rewards paid, never active members. Clawing credits back on removal was rejected: it takes credits away from honest teams. One reward per invitee email across all platforms was dropped: it needs a record of every rewarded email, a second email address gets around it anyway, and the per-platform cap already limits the total. Storing anything in the AP database was rejected: the billing provider holds the slots and the billing console pays, and AP keeps no record of rewards.

## Consequences
When an invited person joins, Cloud AP queues a one-time system job. The job uses one reward slot on the platform's plan, and if the plan had one left, asks the billing console to pay. It retries with backoff for about 17 hours, so an outage delays a reward instead of losing it, and a retry never uses a second slot or pays twice. AP has no table or env var for this and reads the reward list back from the console. The credits are a one-time gift and never expire. Raising the slot count on the plans lets platforms earn more, but only platforms on a plan version that carries the new count. Platforms on a plan version without slots earn nothing until they are moved to one. Only people who join after launch earn: members who joined before launch earn nothing and there is no back-pay. An invite sent before launch still earns when it is accepted after launch.
