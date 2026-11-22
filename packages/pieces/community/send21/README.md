# pieces-send21

[send21](https://send21.io/) piece: crypto pay links and payment drafts. A flow prepares them, and the payer signs and sends from their own wallet. send21 never holds keys or funds, and no API key can move funds.

## Actions

| Action | API |
| --- | --- |
| Create Payment Request | `POST /api/v1/payment-requests` (fiat-priced pay link; output includes `payLink`) |
| Create Draft | `POST /api/v1/drafts` |
| Get Draft | `GET /api/v1/drafts/{id}` |
| Get Draft Status | `GET /api/v1/drafts/{id}/status` |
| Custom API Call | any `https://send21.io/api/v1` endpoint |

Create calls send an `Idempotency-Key` header.

## Trigger

**Payment Event (Webhook)** registers the flow's HTTPS URL with `POST /api/v1/webhooks` when the flow is published, and deletes it when the flow is turned off. It checks `X-Send21-Signature-V2` (HMAC-SHA256 of `<timestamp>.<delivery id>.<raw body>`, 5-minute window) and drops deliveries that fail the check. send21 does not dedupe retries, so the trigger runs once per `X-Send21-Delivery` id.

## Building

Run `turbo run build --filter=@activepieces/piece-send21` to build the library, and `turbo run test --filter=@activepieces/piece-send21` to run its tests.

Docs: https://send21.io/docs/quickstart. Questions: info@send21.io
