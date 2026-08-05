---
status: accepted
---

# Autumn platform_plan schema change ships additively; destructive cleanup is a follow-up PR

## Context

The Autumn billing branch originally carried six `platform_plan` migrations, three of them
destructive (dropping Stripe columns, dropping legacy OpenRouter AI-credit columns, renaming
`includedAiCredits`) plus an in-place `teamProjectsLimit` enum→integer type conversion. Reverting
the PR would have required running `down()` migrations against production — a revert of the code
alone would leave old code reading a schema it no longer understands.

## Decision

The whole schema change ships as **one fully additive migration**
(`1818000000000-AddAutumnBillingColumnsToPlatformPlan`), so reverting the PR is a code revert with
zero DB surgery:

- New columns added: `autumnCustomerId`, `autumnApiKey`, `usersLimit`, `scheduledUsersLimit`,
  `includedCredits` (backfilled from `includedAiCredits`, which stays), and
  `billedTeamProjectsLimit` (backfilled `NONE→0`, `ONE→1`, `UNLIMITED→NULL` from the old enum
  column, which stays untouched).
- The numeric limit is **renamed in both code and DB** to `billedTeamProjectsLimit` — a permanent
  name, no transitional override. The old varchar `teamProjectsLimit` continues to serve any
  pre-Autumn release. The Autumn **feature id** stays `teamProjectsLimit` (renaming it would touch
  every plan in the live catalog); the projection maps it explicitly onto
  `plan.billedTeamProjectsLimit` — the one deliberate exception to the id-equals-column rule.
- Defaults added on the kept NOT NULL columns the new entity no longer writes — `includedAiCredits`
  (0), `aiCreditsAutoTopUpState` ('disabled'), `agentsEnabled` (true), `teamProjectsLimit`
  ('NONE') — so inserts from both old and new code succeed in either direction (rolling deploys
  and reverts).
- Nothing is dropped, renamed, or type-converted; `breaking = false`.

## Follow-up PR (required, soon after the release soaks)

Open a cleanup PR that drops the now-unused columns and finishes the rename:

- Drop `stripeCustomerId`, `stripeSubscriptionId`, `stripeSubscriptionStatus`,
  `stripeSubscriptionStartDate`, `stripeSubscriptionEndDate`, `stripeSubscriptionCancelDate`.
- Drop `aiCreditsAutoTopUpState`, `aiCreditsAutoTopUpThreshold`, `aiCreditsAutoTopUpCreditsToAdd`,
  `maxAutoTopUpCreditsMonthly`, `lastFreeAiCreditsRenewalDate`.
- Drop `includedAiCredits` and `agentsEnabled`.
- Drop the old varchar `teamProjectsLimit` (and its transitional 'NONE' default).
  `billedTeamProjectsLimit` keeps its name — no rename-back.
- That migration is destructive (`breaking = true`) by design — the revert window it closes is the
  point of this two-step split.

## Rejected

- In-place `teamProjectsLimit` type conversion (original design): a code-only revert leaves old
  code misreading integers where it expects `NONE/ONE/UNLIMITED`.
- A transitional column name with an entity `name:` override (e.g. `teamProjectsLimitNumeric`):
  works, but leaves a rename-back step in the cleanup PR and a hidden property↔column mismatch in
  the meantime; the explicit new domain name was preferred.
