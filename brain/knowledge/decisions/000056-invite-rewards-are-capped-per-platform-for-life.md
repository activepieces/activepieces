---
status: accepted
---

# Invite rewards are capped per platform for life

## Decision
A free Cloud platform earns bonus credits (1,000 by default) each time an invited person joins as a new member, at most 4 times over the platform's whole life. An invitee email earns a reward once, ever, across all platforms. Removing a member never frees a slot and never takes the credits back. Self-hosted installs get no invite reward.

## Context
The free plan allows 5 users, and the reward exists to push a platform from 1 to 5. On self-hosted, credits only cap AI usage on the team's own provider keys, so a bonus there gives nothing of value, and a self-hosted server is not a trustworthy witness that someone joined.

## Why
Inviting 4 people, collecting the credits, removing them and inviting 4 more must not earn more than 4,000 credits in total, so the cap counts rewards granted, never active members. Clawing credits back on removal was rejected: it takes credits away from honest teams. Storing the ledger in the AP database was rejected: AP keeps no record of rewards, so the console owns the cap and the once-per-email rule in one place.

## Consequences
When an invited person joins, Cloud AP tells the console, authenticated with the console API secret, and the console checks the free plan, the cap and the email, then grants. Each grant is a separate one-off `apCredits` balance whose id is the reward id, so a retry never pays twice and the monthly reset never wipes it. AP has no table, job or env var for this and reads the reward list back from the console. The credits are a one-time gift and never expire. Any free platform can earn, including ones created before launch, but only for people who join after launch: members who joined before launch earn nothing and there is no back-pay. An invite sent before launch still earns when it is accepted after launch.
