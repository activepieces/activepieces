---
status: accepted
---

# Platform admin telemetry is sent from every edition

## Decision

The five `platform.admin.*` events are deliberately **not** in
`CLOUD_ONLY_TELEMETRY_EVENTS`. They fire wherever product analytics is on, which
means Cloud always, and self-hosted CE and EE whenever the platform owner has
switched Product analytics on under Infrastructure > Configurations.

## Context

The account and sign-in events went the other way: decision
`000034-account-and-sign-in-telemetry-is-cloud-only` put all thirteen behind
`CLOUD_ONLY_TELEMETRY_EVENTS` and hid them from the self-hosted disclosure dialog.
A reader who meets that rule first will reasonably assume every new event follows
it, so the divergence is worth stating rather than leaving to be discovered from a
missing set membership.

## Why

Platform administration is the one surface where self-hosted signal is worth more
than Cloud signal. Cloud admins are a small, well-instrumented population we can
ask directly; EE admins are the people the fifteen-page redesign was drawn for, and
we have no other read on which of those pages they open or which locked control
they press. Fencing the events to Cloud would leave the redesign unmeasurable
exactly where it matters.

The consent argument that carried `000034` does not apply here. Account events fire
during sign-up, before anyone could have opted in, and eleven of the thirteen could
not physically happen off Cloud. These fire only for a signed-in platform admin on
an instance whose owner has already turned the switch on, and
`tracked-events-catalog.ts` is a `Record` over the whole enum, so the compiler
refuses to build until each one is described in the "Events we track" dialog those
same admins read. The disclosure is enforced, not promised.

Rejected: mirroring `000034` for symmetry. Consistency between the two sets is not
a property anyone benefits from, and buying it costs the only admin-usage data we
would ever get from Enterprise.

## Consequences

Self-hosters see a new **Platform administration** group in the disclosure dialog
listing all five events, and the existing `tracked-events-catalog` test that
asserts which groups appear had to be updated to expect it. Any later
`platform.admin.*` event inherits this decision by default; putting one in
`CLOUD_ONLY_TELEMETRY_EVENTS` is now the choice that needs an argument.

Comparisons across editions must account for the switch: a self-hosted instance
with analytics off contributes nothing, so absence in the data is not absence of
use. Event volume is not a population count.
