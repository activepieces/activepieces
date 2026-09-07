---
status: proposed
---

# Entitlement flags are resolved from the customer's plans, never from `customer.flags`

## Context

`refreshEntitlements` projects the Autumn customer into `platform_plan`. The obvious source for the
boolean feature flags is `customer.flags` — Autumn hands it over already flattened, keyed by feature
id, on the same response the balances come from.

That map cannot carry the meaning we need. It is keyed by feature id, so when two attached plans grant
the same feature Autumn collapses them into one entry and reports `planId: null` — the identical shape
it uses for a standalone customer-level grant. And two plans routinely *are* attached: `free` is
`auto_enable`, and attaching a **purchase**-shaped plan (`appsumo`, `free_legacy`) does not replace it
the way a subscription does. So for those customers the flag set is the union of `free` and their real
plan, with every shared flag reporting no source plan.

`toAutumnEntitlements` had already grown a special case around this — `showPoweredBy` was read as
`!isNil(flag.planId)` — which inverted itself under the merge and handed every AppSumo and
Free-Legacy platform free white-labelling.

## Decision

Resolve the flags from the plans themselves. Build an **entitlement plan set** — all active
subscriptions (add-ons included) plus every purchase that has not expired — and union the boolean
items on those plans.

`free`, `free_legacy` and `appsumo` are **baseline** plans. They supply the flags when nothing else is
attached, and all three are dropped from the union as soon as a non-baseline, non-add-on plan appears,
so an AppSumo platform that later buys `plus` gets `plus`'s flags with no baseline leftovers. Add-ons
are never dropped and never trigger the drop, so a credit top-up cannot strip a free platform's flags.
No customer can reach zero flags.

`customer.flags` is not read for the projection at all, and `billingEnforced` comes from the same set
rather than a second source.

Balances stay on `customer.balances`: that is the real balance, and the only place a one-off top-up
grant appears.

`planId` and `scheduledUsersLimit` keep using base subscriptions only. An add-on is neither the
platform's plan name nor a seat schedule.

## Why

The plan set is the same thing `planId` already resolves to, so the projected flags and the projected
plan name can no longer disagree — which is what the `showPoweredBy` special case was failing to
paper over. It also removes `flag.planId` from the design entirely, and that field is unusable by
construction: it cannot distinguish "granted by two plans" from "granted outside any plan".

Subtracting `free`'s flags from `customer.flags` instead was rejected: it needs a catalog read to know
what `free` grants anyway, and it leaves the merged-`planId` trap in place for the next reader.
Fixing the Autumn catalog instead — dropping `auto_enable` from `free`, or making `appsumo` a
subscription — was rejected because it mutates live billing data and the next purchase-shaped plan
reintroduces the union.

## Consequences

AppSumo and Free-Legacy platforms get `showPoweredBy` back, so the "Powered by Activepieces" badge
returns for them. Nothing needs a migration: `platform_plan` rows self-heal on the next
`refreshEntitlements`.

A flag granted directly onto a customer outside any plan is now invisible. That is accepted —
entitlements come from plans.

**Every `getCustomer` call that feeds an entitlement decision must pass
`expand: ['subscriptions.plan', 'purchases.plan']`.** Without it the plans come back with no `items`,
every flag resolves absent, and `billingEnforced` in particular fails *open* — credit gating silently
stops for every platform. Nothing in the type system catches this, because `plan` is optional on both
subscriptions and purchases. Two defences: `writeCustomerStateCaches` takes the resolved
`grantedFeatureIds` as an explicit parameter rather than deriving it privately, so a new call site has
to confront the requirement; and `toGrantedFeatureIds` logs a warning when a customer has attachments
but none of them carry an expanded plan.

The projection becomes an exhaustive `Pick<PlatformPlanLimits, ProjectedFlagId>` object literal
instead of a hand-written id array, so adding a `FeatureFlagId` that has a `platform_plan` column
fails the build until it is mapped. `agentsEnabled` joins the projection under that rule while no
Autumn plan grants it yet, which switches agents off for every Cloud platform and every license-keyed
EE self-host until the feature is attached to plans. CE is unaffected — it skips entitlement sync.
