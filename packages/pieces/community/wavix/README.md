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

## Building

Run `turbo run build --filter=@activepieces/piece-wavix` to build the library.
