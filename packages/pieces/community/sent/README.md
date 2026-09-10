# Sent

Send and track SMS, WhatsApp, and RCS messages through the [Sent API](https://api.sent.dm/v3).

## Connection

In the [Sent Dashboard](https://app.sent.dm), open **Settings → API Keys** and create a key with the permissions needed by your flows. Enter it in the piece's **API Key** connection field. The connection is validated using `GET /me`; the key is sent in `x-api-key`.

Organization keys can select a **Sender Profile** in the relevant steps. Standalone and profile keys should leave that field empty. Approved templates and webhook events load from Sent using the selected connection and profile.

## Actions

| Action | Purpose |
| --- | --- |
| Get Account | Read the connected account. |
| List Contacts | List or search contacts with pagination. |
| Get Contact | Read a contact using an ID from List Contacts. |
| Get Phone Number Details | Look up an E.164 phone number. |
| Send Message | Send text or an approved template, with optional sandbox and idempotency settings. |
| Get Message Status | Look up a message's delivery status. |
| Get Message Activities | Read a message's activity history. |
| Custom API Call | Call another Sent v3 endpoint using the connection. |

Send Message returns asynchronous acceptance, not proof of delivery. Map a recipient's `data.recipients[].message_id` into the status and activities actions. Selecting multiple channels broadcasts separate messages; it does not define a fallback order.

Enable **Sandbox** to validate a message request without sending it. Sandbox responses can contain simulated IDs that are not available to subsequent lookup requests; use an existing test message ID when testing those lookups. Keep sandbox enabled throughout test flows.

For a send retry, reuse the same explicit **Idempotency Key** within Sent's 24-hour window. Use a new key for each intentional send, including each loop item. The piece makes no automatic HTTP retries. A timeout does not establish whether Sent accepted a request.

Custom API Call is restricted to `https://api.sent.dm/v3/`. Redirects must remain disabled, and the connection supplies `x-api-key`. Organization keys can add `x-profile-id` in Headers. Custom calls can modify data; their method and body determine whether they are safe to repeat.

## Webhook triggers

- **New Event** subscribes to the selected Sent events.
- **New Message Received** subscribes to inbound `message.received` events.

Configure a publicly reachable HTTPS webhook URL in Activepieces before enabling either flow. Enabling registers the subscription; enabling an unchanged subscription reuses it. Disabling removes the subscription. If cleanup fails, the subscription state is retained so disabling can be retried.

The piece verifies the raw request body with HMAC-SHA256, checks the webhook ID and a five-minute timestamp tolerance, and checks that the event header matches the signed body. Invalid signatures are rejected. Signing secrets are stored encrypted using a key derived from the connection API key. Disable webhook flows before rotating that key, then reconnect and enable the flows again.

Signature verification is not event deduplication: a valid delivery can be repeated within the timestamp window. Downstream flows that require once-only processing should deduplicate using the event's stable identifier before performing side effects.

## Development checks

From the repository root, install the locked dependencies with `bun install --frozen-lockfile`, then run:

```sh
npx turbo run test lint typecheck build --filter=@activepieces/piece-sent...
```

The tests cover request mapping, dynamic fields, input validation, credential redaction, signatures, encrypted subscription state, idempotent subscription retries, reuse, and cleanup. Live verification requires a Sent test account and, for webhooks, a reachable HTTPS endpoint. Never commit API keys or captured customer data.
