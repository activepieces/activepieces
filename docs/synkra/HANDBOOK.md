# Synkra Flow Developer Handbook

This is the living document for the Synkra Flow platform. Everything a new
developer needs to pick up the work lives here.

**Last updated:** 9 October 2026
**Maintained by:** whoever is working on the repo

## What is Synkra Flow

Synkra Flow is a fork of Activepieces, rebranded and extended for the South
African market. It gives users a no-code automation builder. They connect
their apps, build workflows, and run them. We charge for tiers, metered
usage, and AI credits.

## Quick start

If you are new:

1. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** to understand how the pieces fit together.
2. Read **[BUILDING.md](./BUILDING.md)** to learn how to run and deploy.
3. Read **[PIECES.md](./PIECES.md)** to add a new integration.
4. Read **[CHANGELOG.md](./CHANGELOG.md)** to see what happened recently.

## The docs

| Document | What it covers |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | How the platform is structured. Repo layout, containers, data flow. |
| [BUILDING.md](./BUILDING.md) | How to build, deploy, restart, and roll back. |
| [PIECES.md](./PIECES.md) | How to add a new integration to the platform. |
| [OAUTH.md](./OAUTH.md) | How to register and configure OAuth integrations. |
| [BILLING.md](./BILLING.md) | Paystack setup, tier definitions, enforcement rules. |
| [BRANDING.md](./BRANDING.md) | Logo, colours, translations, and how to change them. |
| [HIDDEN-FEATURES.md](./HIDDEN-FEATURES.md) | What we have hidden in V1 and how to unhide it later. |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and how to fix them. |
| [CHANGELOG.md](./CHANGELOG.md) | Session log. Every feature, every fix, every decision. |

## The rules

These keep the codebase sane. Follow them.

1. **Never commit secrets.** Everything sensitive goes in `.env` (not tracked). Secrets for integrations go in the platform DB via the UI, not in code.
2. **Never delete, hide.** Features we are not shipping today get hidden via route guards or plan flags, not removed. We can unhide them when we are ready.
3. **User-facing text only gets renamed.** We rename labels, buttons, and page titles. We never rename code identifiers, database columns, API endpoints, or npm package names. Those are load-bearing.
4. **South African English in all user-facing copy.** Colour, organise, centre, favour. Complete sentences. No em dashes. No fragments joined by full stops.
5. **Every session updates the CHANGELOG.** What shipped, what broke, what was decided.

## Who built this

- Refilwe Molapisi — product owner and platform operator
- Claude — engineering assistant
- Original foundation: Activepieces 0.92.0 (forked)

## License note

Activepieces is licensed under the MIT License. Our fork keeps that license.
See `LICENSE` at the repo root.
