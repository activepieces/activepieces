---
icon: 📗
---

# Engineering Handbook & Playbooks

The public company handbook shipped with the docs — how the Activepieces team works. Source: `docs/handbook/`. (This is the published handbook, distinct from the internal Engineering area in this brain.)

## Handbook
- **Overview** and **Team**.
- **Hiring** — hiring process, levels, team, compensation.
- **Customer Support** — overview, tone, Pylon workflow, handling requests.

## Engineering onboarding
Onboarding checklist, how we work, on-call, downtime/incident, stack, release cycle. Work runs in **one-week sprints** shared publicly on GitHub; engineers drive their own sprint items. PR guidelines: open a draft PR early, review others proactively, one reviewer per PR, add it to the sprint, PR owner drafts test scenarios, break large features into continuously-merged small tasks.

## Playbooks
Run EE, building for self-hosting, setup BetterStack, releases, canary deployment, queue metrics, infrastructure, database migration, structured logging, security advisory response, product announcement, frontend best practices, e2e tests, testing strategy, connect Claude to Chrome, AI engineering guide.

## Postmortems & product
Postmortems (Redis/queue overload, infra upgrade — March 2026) and product interface-design notes.

## Gotchas
- **`DISCORD_ON_CALL_WEBHOOK` is the single repo secret behind every on-call Discord notification** — cloud production deploys (`continuous-delivery-cloud.yml`), self-hosted releases (`release-self-hosted.yml`), and release-pieces failure alerts all post through it. Rotating it repoints all of them at once; there is no per-workflow webhook. Self-hosted release notifications skip `-rc` tags unless `publish_rc_release` is set, mirroring the release-drafter condition so the message never links a release page that doesn't exist.
