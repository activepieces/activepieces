# Wafly

WhatsApp API built for automations and AI agents.

Nobody writes a paragraph on WhatsApp. People send `hi`, then `you there?`, then
`how much is it?` — three separate webhooks, so an agent replies three times and
the first two replies were written before the person finished asking. Half the
time the real question arrives as a voice note, which an LLM cannot hear at all.

Wafly solves both in the pipe: consecutive messages from the same person are
delivered as **one** event, and voice notes arrive already transcribed.

## Actions

| Action | What it does |
|---|---|
| Send Text Message | Text to a number or group |
| Send Media | Image, video, audio or PDF |
| Send Poll | Poll with two or more options |
| Create Group | New group with participants |
| Check Numbers on WhatsApp | Which numbers in a list have WhatsApp |
| Get Instance Status | Whether the instance is connected |
| Configure Message Buffer | Group split messages into one event |
| Configure Audio Transcription | Transcribe incoming voice notes |

The last two are **instance-level settings** — run once, not per message.

## Trigger

**New Message Received** — fires on every inbound message, already grouped and
transcribed when those settings are on.

> Wafly has no API to register a webhook URL. After enabling the trigger, copy
> the webhook URL from Activepieces and paste it in the Wafly dashboard under
> **Instance → Webhooks**. It is a one-time step.

## Connection

Get these from [wafly.com.br](https://wafly.com.br):

| Field | Where |
|---|---|
| Base URL | `https://wafly.com.br/api-bridge-whats` (default) |
| Client Token | Dashboard → Security |
| Instance | The instance name |
| Instance Token | That instance's token |

Free 3-day trial, no card. Connect by QR Code.

## Audio transcription uses your own OpenAI key

The cost lands on your own OpenAI account and Wafly charges nothing on top. The
key is stored encrypted and never returned by the API. Set a monthly cap so it
cannot run away — and if the cap is hit or the provider refuses, **the message
still arrives**, only without the transcript. Nothing is dropped.
