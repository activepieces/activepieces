---
status: accepted
---

# Chat onboarding asks only users with no row, and a backfill closes the door behind existing ones

## Decision
The first-run onboarding card ("Who am I teaming up with?") renders when the caller has **no `chat_personalization` row at all**, a state the service synthesizes as `UNSET` and never persists. To keep that from firing for the entire existing user base on ship day, the shipping migration **backfills one terminal row per existing user** rather than gating the card on a hardcoded ship date.

## Context
The card's gate is `isEmpty && !incognito && (isFirstRun || promptOpen)`, where `isFirstRun` is `status === UNSET`. `UNSET` means "no row exists", not "new account", so on first deploy every user who had never answered would have met it, including the grandfathered cloud users from the 200-user chat rollout cap. Those people have been chatting for months and would have opened a normal new chat to find a new-user welcome takeover where their greeting used to be.

The obvious fix is `user.created > SHIP_DATE`. It works, and it leaves a date constant in the code that nobody ever deletes and no one dares change.

## Why
Backfilling puts the fact in the data, where it is true, instead of in a branch that has to keep being true. After the migration `UNSET` means exactly what it says: a user who has never been asked. The gate needs no second clause, no clock, and no knowledge of when we shipped.

It also keeps the door open in a way the date constant does not. A backfilled row is a real row we can query, so "existing users we never onboarded" is a population we can count and later invite deliberately, rather than a set defined by an inequality against a magic number.

The legacy rows take a **distinct terminal status, not the existing `SKIPPED`**. `SKIPPED` means a user saw the question and declined it, which is a genuine signal about that person. Reusing it would blur those two groups together permanently and make the invite-them-later query impossible to write.

Rejected: gating on `user.created` against a ship-date constant, for the reasons above.

## Consequences
- The migration writes one row per existing user in a single `INSERT ... SELECT`. It is the hardest thing in this feature to reverse, since un-writing it cannot distinguish a backfilled row from a real one. The distinct legacy status is what makes it reversible at all.
- Anyone adding a status to the enum must decide whether it is terminal for this gate. A non-terminal addition silently re-opens the card for everyone holding it.
- The card is still gated on an empty conversation, so a backfilled user never sees it even if a row is later cleared by hand.
- Shipped with the feature on `feat/chat-onboarding-personalization`, as `BackfillChatPersonalizationForExistingUsers`. It skips users with a null `platformId`, which the `user` table still permits, because the target column is `NOT NULL`.
