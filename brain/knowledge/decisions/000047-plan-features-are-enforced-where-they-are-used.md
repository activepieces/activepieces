---
status: accepted
---

# Plan features are enforced where they are used, not only where they are set up

## Decision
A Team or Enterprise feature stops working once the plan no longer includes it, not just its settings page. Each gate sits at the feature's choke point and reads the plan through `planFeatures`: SAML sign-in, embed sign-in, global connections handed to runs, secret-manager lookups, own AI keys, saved agents in chat and custom roles. A lapsed feature fails with `FEATURE_DISABLED` (402) and a message naming it. Nothing is deleted, so an upgrade brings everything back.

## Context
Most gates sat on the admin routes that configure a feature (`platformMustHaveFeatureEnabled`), so anything set up while a plan or trial was live kept working after it lapsed. The self-serve Enterprise Trial makes that the common case, because every trial ends.

## Why
Checking only at setup let a lapsed plan keep its Enterprise features. A clear plan error won over quiet fallbacks (AI steps moving to credits, SAML users sent to email sign-in) because an unexplained change of behaviour is harder to support than an error that says why. Two features degrade instead of failing, so nobody is locked out of their own work: a custom-role member acts as Viewer, and deleting a flow or table with git sync connected still deletes it and skips the push. An env var to switch enforcement off was rejected as one more setting to support.

## Consequences
- A functional breaking change, documented in `docs/install/reference/breaking-changes.mdx`.
- `planFeatures` is always enabled on Community and caches each plan for 60 seconds per process. `platformPlanService.update` clears the entry, so a refresh applies at once on the instance that ran it and within a minute on the others.
- Admin routes keep their existing lapse behaviour: a gated module returns 402 on every route, including delete. Model tiers and AI keys stay deletable after a downgrade, as [decision 000044](./000044-platform-tiers-are-platform-owned-and-grant-key-access.md) and its PR intended.
- Cloud branding follows `customAppearanceEnabled` like self-hosted, so platforms without it, Free included, get the default look in the app, emails and the chat page.
- A model tier fails with the plan error when its main model uses an own key. Own-key fallbacks behind a managed main model are skipped, because the step would not have used them.
- The engine and the AI step job show the API's message for a 402, instead of "Failed to load connection" or the RPC wrapper.
- Seats and team projects are not locked at a lapse yet.
