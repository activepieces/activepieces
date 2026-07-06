# Eden AI — Activepieces piece

[Eden AI](https://www.edenai.co/) is a unified AI API: one key, one endpoint, **500+ models** from every major provider (OpenAI, Anthropic, Google, Mistral, Meta, Cohere, xAI, Amazon, DeepSeek, Groq…), plus native features for OCR, document parsing, translation, speech and moderation. Eden AI is **EU-based and GDPR-focused**, and offers **EU data-residency model variants** for privacy-sensitive workloads.

This piece lets you use Eden AI's LLM and AI features inside your Activepieces flows.

## Authentication

Create an API key in your [Eden AI dashboard](https://app.edenai.run/admin/api-settings/features-preferences) and paste it into the connection. The key is validated against `GET https://api.edenai.run/v3/models`.

> Your API key is stored as an Activepieces secret and sent only as a `Bearer` token to `api.edenai.run`. It is never logged or embedded in flow data.

## LLM chat — Generate Text

The **Generate Text** action calls Eden AI's **v3 OpenAI-compatible** endpoint (`POST /v3/chat/completions`). Optionally filter by **Provider**, pick a **Model** from the live catalogue (the exact `provider/model` id), and send your prompt. Supports system prompts, temperature, max tokens, reasoning effort, image input (vision models) and fallback models. The Provider and Model dropdowns are populated live from `GET /v3/models`, so you always see exactly what your account can call.

### 🇪🇺 EU Data Residency (GDPR)

Eden AI hosts a large share of its catalogue (≈270 of 760+ models) in the **European Union**. Enable the **EU Data Residency** checkbox and the Provider/Model dropdowns are **filtered to EU-hosted models only**, so inference is processed within the EU. EU-hosted models are flagged with **🇪🇺** in the dropdown, and the value sent is the exact model id — no manual suffix handling.

Use it when:

- You process personal data and need processing to stay in the EU (GDPR Art. 44+ data-transfer constraints).
- Your organization has a data-residency or sovereignty requirement.

**How EU hosting is expressed:** each model in `GET /v3/models` carries a `regions` list. A model is EU-hosted when its regions include `{ "code": "eu" }`. Some providers also publish explicit regional variants whose id ends in `@eu` / `@us` (e.g. `amazon/amazon.nova-2-lite-v1:0@eu`); most EU-hosted models simply use their plain id (e.g. `amazon/amazon.nova-lite-v1:0`). Either way, the EU filter selects the correct ids for you.

> EU coverage evolves; the live catalogue (`GET /v3/models`, `regions`) is the source of truth, which is exactly what the dropdown reflects.

## Other AI features

The piece also ships actions for **Summarize Text, Extract Keywords, Detect Language, Extract Entities, Moderate Text, Spell Check, Translate Text, Invoice Parser, Receipt Parser, OCR Image, Image Generation and Text to Speech**, backed by Eden AI's feature API.

## Building

Run `turbo run build --filter=@activepieces/piece-eden-ai` to build the library.
