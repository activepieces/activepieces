# LoopQuest

Human-in-the-loop review for AI output. Gate an automation until a person approves (block), or monitor its quality in the background.

## Actions
- **Create Review Task** — send output to a human; pick a game (Swiper, Versus, Sorter, Detective, Fixer, Redact, Grounding) and a mode (gate or monitor), with an optional timeout + on-timeout fallback.
- **Get Task Status** — poll a task's status / verdict.

## Triggers
- **New Verdict** — fires when a review resolves. Auto-subscribes the flow's webhook to LoopQuest on enable and unsubscribes on disable.

## Auth
A LoopQuest API key (Workspaces → API keys) and an optional Base URL for self-hosted deployments.

Docs: https://loopquest.tomphillips.uk/docs
