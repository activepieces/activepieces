# @activepieces/piece-virtualsms

[Activepieces](https://activepieces.com) piece for [VirtualSMS](https://virtualsms.io) — real-SIM SMS verification across 145+ countries and 2,500+ services.

## Auth

`X-API-Key` from https://virtualsms.io → Settings → API Keys.

## Actions

- **Buy Number** — purchase a phone for a service code + ISO country code
- **Get Order Status** — current status + any received SMS for an order UUID
- **Cancel Order** — cancel + refund (returns HTTP 425 inside 120-second cooldown)
- **List Services** — full service catalog (codes + base prices)
- **List Countries** — country catalog (ISO codes, min prices, supported services)
- **Check Price** — look up cost for a service/country combo before purchase
- **Get Balance** — account balance
- **Custom API Call** — generic escape hatch for any `https://virtualsms.io/api/v1/*` endpoint

## Triggers

All polling-based (VirtualSMS does not currently expose a customer-facing outbound webhook):

- **Order Received SMS** — fires once per order newly transitioning to `completed` (the terminal status when an SMS arrives)
- **Order Expired** — fires once per order newly transitioning to `expired`
- **Low Balance** — fires once when balance crosses below threshold (debounced)

## Service codes

Services use short codes (`wa`, `tg`, `aws`), not slugs. Use **List Services** to discover.
