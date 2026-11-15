---
status: accepted
---

# Invite rewards are capped per platform for life

## Decision
A Cloud platform on a self-serve plan (Free, Plus or Team, monthly or annual) earns bonus credits (1,000 by default) each time an invited person joins as a new member, at most 4 times over the platform's whole life, whatever plan it moves to. The same person earns a reward for each platform they join. Removing a member never frees a slot and never takes the credits back. Self-hosted installs get no invite reward.

## Context
The reward exists to push a team toward the free plan's 5 users, so the cap is 4: the owner plus four invitees. On self-hosted, credits only cap AI usage on the team's own provider keys, so a bonus there gives nothing of value, and a self-hosted server is not a trustworthy witness that someone joined.

## Why
Inviting 4 people, collecting the credits, removing them and inviting 4 more must not earn more than 4 rewards, so the cap counts rewards granted, never active members, and a plan change does not reset it. Clawing credits back on removal was rejected: it takes credits away from honest teams. One reward per invitee email across all platforms was dropped: it needs a record of every rewarded email, a second email address gets around it anyway, and the per-platform cap already limits the total. Storing anything in the AP database was rejected: the billing console owns the count and the payments in one place, and AP keeps no record of rewards.

## Consequences
When an invited person joins, Cloud AP queues a one-time system job that tells the billing console, which checks the plan and the cap and grants. The job retries with backoff for about 17 hours, so an outage delays a reward instead of losing it, and a retry never pays twice. AP has no table or env var for this and reads the reward list back from the console. The credits are a one-time gift and never expire. The cap is a fixed 4 and does not follow the free plan's seat count. Any eligible platform can earn, including ones created before launch, but only for people who join after launch: members who joined before launch earn nothing and there is no back-pay. An invite sent before launch still earns when it is accepted after launch.
