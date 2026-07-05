# Tunova (Activepieces piece)

Generate music with **Suno (v5.5)** from your Activepieces flows via the [Tunova](https://tunova.ai)
API — async, and **billed only on a successful render** (a failed render auto-refunds).

## Authentication

Create a **Tunova** connection with your API key (`sk_live_…`). Get one free — 50 tokens, no card —
at <https://tunova.ai>. The key is sent as the `X-API-Key` header.

## Actions

- **Generate Song** — submit a job from a text prompt (`prompt`, `model` default `v5.5`, optional instrumental). Async: returns a `job_id`.
- **Get Job** — poll a `job_id`; once `status` is `complete`, `clips[].audio_url` is set.
- **Generate Lyrics** — generate song lyrics from a theme/brief.
- **Custom API Call** — call any Tunova endpoint directly.

Docs: <https://api.tunova.ai/docs>. Tunova is an independent service, not affiliated with Suno.
