---
icon: 👋
---

# Chat Personalization

The first-run onboarding inside chat. A user with no row is asked "Who am I teaming up with?" and fills one sentence, `I'm a [role] at [company]`. Answering queues background research that reads the company and has a model author use-case cards, which then replace the stock cards in the empty state. Lives with chat, so it is Cloud and Enterprise only and never reachable when chat is not.

**UNSET** the synthesized status meaning no row exists, so this person has never been asked. Never persisted.
**DISMISSED_LEGACY** written by the shipping backfill to every user who existed before the feature. Terminal, and deliberately distinct from SKIPPED.
**SKIPPED** the user saw the question and declined, or research was not allowed to run.
**Company row** the `userId IS NULL` row holding the company answer and its research; one per platform.
**User row** a per-person row; a teammate's own role-targeted result wins over the company row once READY.

## How it works
- `GET`/`POST /v1/agents/personalization`, mounted on the chat surface behind `chatVisibilityGuard`.
- `POST` writes the answer, runs `guardsAllowResearch` (chat AI provider present, credits not blocked, under 5 runs per platform per day) and queues `EXECUTE_PERSONALIZATION_RESEARCH`. It returns 202 with the current view; progress arrives over `CHAT_PERSONALIZATION_PROGRESS` on the userId room, and the client also polls while the status is in flight.
- The worker claims the row by flipping PENDING to RESEARCHING, gathers a homepage read plus web searches, then synthesizes a profile and 12 to 20 cards in parallel on the fast model. A crashed run is recovered on read: an in-flight row whose heartbeat stopped two minutes ago is reset and re-enqueued, bounded by the daily cap.
- The **company blank prefills from `platform.name`**, not from the user's email, via `chatPersonalizationUtils.companyFromPlatformName`. That covers invited teammates whose personal address does not match the company. It returns null for a name the signup generator produced from a person, so the blank stays empty rather than offering "Ahmad's Platform" as a company.

## Gotchas
- **The prefill only works once the platform is named after the company.** It reads `platform.name`, so it depends on work-email platform naming; before that shipped every platform was `"<FirstName>'s Platform"` and the predicate correctly rejected all of them. A person-named platform yields an empty blank, not a wrong one.
- **Apollo and Clearbit are Cloud-only and both optional.** Apollo guesses the role from `AppSystemProp.APOLLO_API_KEY` and Clearbit powers company autocomplete from the browser. Neither runs off Cloud, and neither is required: the company blank fills locally on every edition. Apollo deliberately does not read an AI-tool config, because those are per-platform and a fresh signup has none.
- **Research needs a chat AI provider or it degrades to SKIPPED silently.** `guardsAllowResearch` returns false with no provider and the user simply keeps the stock cards. See the AI Providers page for why a local Cloud platform has no provider until you flip `aiProvidersEnabled`.
- **A backfilled user never sees the card, so the personalization chip is their only way in.** The card is gated on UNSET, and the migration made every pre-existing user DISMISSED_LEGACY. Removing the chip would lock the entire existing base out of the feature permanently.

## Key files
- `packages/server/api/src/app/ee/agent/personalization/` — entity, service, controller
- `packages/server/worker/src/lib/execute/jobs/ee/agent/execute-personalization-research.ts` — the research run
- `packages/core/shared/src/lib/ee/agent/chat-personalization.ts` — statuses, view, `chatPersonalizationUtils`
- `packages/web/src/features/chat/lib/` — `use-personalization.ts`, `onboarding-prefill.ts`, `personalization-api.ts`
- `packages/web/src/features/chat/use-cases/` — the card set and its code-drawn art
- `packages/web/src/app/routes/chat-with-ai/components/` — `onboarding-question-card.tsx`, `onboarding-welcome.tsx`, `personalization-chip.tsx`
