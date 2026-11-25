# @activepieces/piece-paymos

Official Activepieces community piece for [Paymos](https://paymos.io) — accept stablecoin (**USDT, USDC, USD1, DAI**) and gold-backed **XAUT** payments across **13 deposit networks**, manage per-customer **Payment Channels** and server-calculated invoice refunds, and trigger Activepieces flows on verified Paymos webhooks.

## Authentication (`Paymos API Credentials`)

Create a Paymos connection using a **Payment API** key pair from **Paymos Dashboard → Developer → API Keys**:

| Field | Required | Description |
| --- | --- | --- |
| **Public Key** | Yes | Payment API key: `pk_live_...` (Production) or `pk_test_...` (Sandbox). Payout keys (`rk_...`) are rejected before any network request. |
| **Secret Key** | Yes | Payment API secret key (`sk_live_...` or `sk_test_...`) used for canonical HMAC-SHA256 request signing. |
| **Webhook Signing Secret** | Trigger only | `whsec_...` signing secret from **Paymos Dashboard → Developer → Webhooks**. Required when activating the **Paymos Webhook Event** trigger. |
| **API Base URL** | Optional | Defaults to `https://api.paymos.io` (used for both Production and Sandbox based on your key prefix). |

Saving the connection validates credentials via a signed `GET /v1/invoices?limit=1` request.

## Actions (8 Payment API Operations)

1. **Create Invoice** (`POST /v1/invoices`) — Create an invoice in any of 45 fiat currencies or supported crypto assets (`USDT`, `USDC`, `USD1`, `DAI`, `XAUT`), with idempotent `external_order_id` (cannot start with `wgt_`), optional `network`, `customer_fee_percent` (0–100), and `client_id`.
2. **Get Invoice** (`GET /v1/invoices/{invoice_id}`) — Retrieve a single invoice by ID (`inv_...`).
3. **List Invoices** (`GET /v1/invoices`) — List invoices with optional `project_id`, multi-value `status`, `external_order_id`, `created_from` / `created_to` (Unix seconds), `limit` (1–100), and `cursor`.
4. **Cancel Invoice** (`POST /v1/invoices/{invoice_id}/cancel`) — Cancel an invoice awaiting client selection with a mandatory `reason` (1–500 characters).
5. **Simulate Sandbox Invoice Payment** (`POST /v1/sandbox/invoices/{invoice_id}/simulate-payment`) — Sandbox only (`pk_test_` required; `pk_live_` is rejected client-side before any network request). Simulates `paid`, `overpaid`, `underpay`, or `cancel`.
6. **Create Payment Channel** (`POST /v1/payment-channels`) — Idempotently create or retrieve a permanent multi-network deposit identity for a customer (`project_id` + `external_id`).
7. **Get Payment Channel** (`GET /v1/payment-channels/{channel_id}`) — Retrieve a Payment Channel (`pch_...`) with provisioned deposit addresses and live minimums.
8. **Create Refund** (`POST /v1/refunds`) — Create a server-calculated `full` or `overpayment` invoice refund back to the first saved sender. Strictly sends `{ invoice_id, mode, external_order_id }`; amount, asset, network, and destination address are calculated server-side.

## Trigger (`Paymos Webhook Event`)

Paymos does not expose a Webhook Management REST API. To receive verified webhook events:

1. Add **Paymos Webhook Event** to your Activepieces flow and copy the generated live webhook URL.
2. Open **Paymos Dashboard → Developer → Webhooks**, create an HTTPS endpoint with that URL, and select the categories you need.
3. Paste the generated `whsec_...` signing secret into the **Webhook Signing Secret** field of your Paymos connection.
4. Select specific canonical events or **All Events (`*`)** and publish the flow.

### Verification & Deduplication

- Verifies `X-Webhook-Signature` (`t={timestamp},v1={hex}`) against the exact `rawBody` using constant-time `timingSafeEqual`, supporting multiple `v1=` signatures during secret rotation and enforcing a 300-second replay window.
- **Fail-closed:** deliveries missing `rawBody`, missing/malformed `X-Webhook-Signature`, failing HMAC verification, or exceeding the timestamp tolerance window return `[]` and never trigger the flow.
- **Bounded persistent deduplication:** stores up to **500** recent `event_id` values in `context.store` under `paymos_seen_event_ids` (FIFO eviction) and suppresses duplicate deliveries.

### Canonical Webhook Events (18)

- **Invoice (9):** `invoice.awaiting_payment`, `invoice.confirming`, `invoice.underpaid_waiting`, `invoice.paid`, `invoice.paid_over`, `invoice.underpaid`, `invoice.expired`, `invoice.cancelled`, `invoice.paid_late`
- **Payment Channel Deposit (3):** `payment_channel.deposit.confirming`, `payment_channel.deposit.reorged`, `payment_channel.deposit.confirmed`
- **Withdrawal (6):** `withdrawal.created`, `withdrawal.processing`, `withdrawal.completed`, `withdrawal.failed`, `withdrawal.cancelled`, `withdrawal.completion_rewound`

## Documentation

- [Paymos Merchant API Documentation](https://paymos.io/docs)
- [Paymos Webhooks Reference](https://paymos.io/docs/webhooks)

## License

MIT
