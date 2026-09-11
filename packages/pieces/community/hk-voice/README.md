# HK Voice AI

AI voice agents and outbound Voice AI phone calls for [Activepieces](https://www.activepieces.com) / Zwigly.

Connect your [Heykoala Voice](https://voice.heykoala.ai) organization, then:

- **Start Voice AI Call** — dispatch with agent, call flow, from-number, and prompt variables (e.g. guest name)
- **Contacts** — create / upsert / search so every call is attributable
- **Webhooks** — Call Analysis Completed (summary, sentiment, lead score), Call Ended / Failed
- **Media** — fetch signed recording and transcript links

## Auth

1. In Heykoala Voice: Settings → API Keys → create a key (`hk_api_…`)
2. Base URL: `https://voice.heykoala.ai` (prod) or `https://dvoice.heykoala.ai` (dev)

Docs: https://voice.heykoala.ai/docs/

## Search keywords

Voice AI, AI voice, AI phone call, outbound call, call agent, call flow, post-call analysis, Heykoala Voice, HK Voice.

## Install

- **Zwigly / Activepieces monorepo:** piece ships as `@activepieces/piece-hk-voice`
- **Cloud custom piece:** Settings → Pieces → Install, or `npm run publish-piece-to-api`
- **Community npm (when published):** install `@activepieces/piece-hk-voice`

## Authors

heykoala
