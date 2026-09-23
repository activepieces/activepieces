# pieces-wavix

[Wavix](https://wavix.com) is a global voice and messaging platform. This piece lets you send SMS/MMS, look up phone numbers, run 2FA verification and transcribe call audio from your flows.

## Authentication

Uses a Wavix API key (`Authorization: Bearer <key>`). Generate one in the Wavix dashboard under **API tokens**.

## Actions

- **Send SMS or MMS** — send a text or media message from one of your Wavix numbers.
- **Look Up Phone Number** — validate a number and fetch carrier, line type and country details.
- **Send 2FA Code** — start a 2FA verification (SMS, voice or other channel) and get a session ID.
- **Verify 2FA Code** — check the code entered by the user against a 2FA session.
- **Transcribe Audio File** — transcribe an uploaded audio file and get the text back.
- **Custom API Call** — call any Wavix API endpoint with your authenticated connection.

## Triggers

- **New Inbound SMS** — fires when one of your Wavix numbers receives an SMS.
- **Call Completed** — fires when a call on your account finishes.

Each Wavix number relays inbound SMS to a single destination, and the post-call webhook is account-wide. These triggers point that single webhook at Activepieces on enable and clear it on disable. If the target webhook is already set — by another flow or by your own integration — enabling the trigger fails, so a number or account feeds only one flow at a time. To free it, disable the flow that set it, or clear the webhook manually:

- **New Inbound SMS** — clear the number's SMS webhook in the Wavix dashboard (My Numbers → number → SMS webhook, or Account → Webhook settings → Inbound SMS webhook).
- **Call Completed** — clear the account post-call webhook via the Wavix API (`DELETE /v1/calls/webhooks`).

## Building

Run `turbo run build --filter=@activepieces/piece-wavix` to build the library.
