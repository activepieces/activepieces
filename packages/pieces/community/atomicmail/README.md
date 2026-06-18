# Atomic Mail Activepieces Piece

Give AI agents and automations a real email inbox — register an @atomicmail.ai address, read and send mail, reply to threads, and run advanced JMAP workflows.

Uses [`@atomicmail/agentic-core`](https://www.npmjs.com/package/@atomicmail/agentic-core) for PoW auth and JMAP execution.

## Local development

1. Set `AP_DEV_PIECES=atomicmail` in Activepieces `.env.dev`
2. `npm start` in the Activepieces repo root

## Credentials (no connection required)

1. Run **Register Inbox** — no connection field; credentials save to the **project store** automatically.
2. On **List Inbox**, **Send**, etc.: leave **Account namespace** as `default` (or match Register). No connection needed.
3. **Optional:** paste an API key on any step, or create a connection with an API key for reuse.

Connections are optional. Empty API keys are valid (shape-only validate; no PoW in connection test).

## PoW and timeouts

PoW runs in flow actions only (register, jmap_request) — not in connection validation. Register may take ~30s on first signup. JWTs cache in project store (~1h).

## Logo (maintainers)

`logoUrl` points to `https://cdn.activepieces.com/pieces/atomicmail.png` (placeholder). Upload the logo to the Activepieces CDN when merging this PR.
