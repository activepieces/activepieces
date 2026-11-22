---
status: accepted
title: Invite rewards are capped by the plan's rewarded invites
---

# Invite rewards are capped by the plan's rewarded invites

## Decision
A Cloud platform earns 1,000 bonus credits each time an invited person joins as a new member, while its plan has rewarded invites left. The plans (Free, Plus and Team, monthly or annual) carry the `rewarded_invites_count` feature, 4 today. AP only tells the billing console "this person joined this customer". The console skips a person it already rewarded on that customer, otherwise uses one rewarded invite in the billing provider and pays the credits. Self-hosted installs get no invite reward.

## Context
The reward exists to push a team toward the free plan's 5 users: the owner plus four invitees. On self-hosted, credits only cap AI usage on the team's own provider keys, so a bonus there gives nothing of value.

## Why
The cap is a plan setting in the billing provider, so it changes without a code change. The billing console owns the payment and its amount, so AP sends only the customer id and the invitee email, and keeps no record. The call is fire-and-forget, not a queued job: a lost call is rare, and the log line with the customer and invitation ids is enough to send it again by hand. Removing a member never frees a rewarded invite and never takes credits back, and inviting the same person again on the same platform earns nothing. The same person joining a second platform earns there.

## Consequences
The billing info sends one number, the rewarded invites left, read from the same customer call. A cancel back to Free restarts the count, so that platform can earn again; this is accepted. A failed console call loses that reward until someone sends it again by hand. Platforms on a plan version without the feature earn nothing until they move to one.
