# Lemon Squeezy — Activepieces Piece

An Activepieces community piece for [Lemon Squeezy](https://lemonsqueezy.com) — the all-in-one platform for selling digital products, SaaS subscriptions, and online courses.

## Features

### Actions

| Action | Description |
|--------|-------------|
| **List Products** | Retrieve a paginated list of products from your store |
| **List Orders** | Retrieve orders with optional filters (status, customer email, store) |
| **Get Order** | Retrieve full details of a specific order by ID |
| **List Subscriptions** | Retrieve subscriptions with filters (status, product, customer, etc.) |
| **Create Checkout** | Generate a checkout URL for a product variant |
| **List Customers** | Retrieve customers with optional email/store filters |
| **Custom API Call** | Make any Lemon Squeezy API request not covered by the above actions |

### Triggers

| Trigger | Description |
|---------|-------------|
| **Order Created** | Fires in real time whenever a new order is placed (via webhook) |

## Authentication

This piece uses Lemon Squeezy API keys.

### How to get your API key

1. Log in at [https://app.lemonsqueezy.com](https://app.lemonsqueezy.com)
2. Go to **Settings → API**
3. Click **+ Add new API key**
4. Name your key and click **Create API key**
5. Copy the key and paste it into Activepieces

> API keys can be created in **live mode** (for production) or **test mode** (for development).

## Use Cases

- **Post-purchase automation** — Send confirmation emails, trigger onboarding sequences, or update CRMs when new orders arrive
- **Subscription lifecycle management** — React to subscription status changes (cancellations, renewals, upgrades)
- **Customer sync** — Keep your CRM or mailing list up to date with Lemon Squeezy customer data
- **Dynamic checkout links** — Generate personalised checkout URLs for upsells or targeted campaigns
- **Order analytics** — Aggregate order and revenue data into dashboards or reports

## API Reference

This piece is built against the [Lemon Squeezy REST API v1](https://docs.lemonsqueezy.com/api). All list endpoints support JSON:API pagination.

## Author

- [Harmatta](https://github.com/Harmatta)

## License

MIT
