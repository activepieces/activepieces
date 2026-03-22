# Activepieces Piece — Dub

> Automate link creation, management, and click-tracking with [Dub](https://dub.co) — the modern link attribution platform.

## Overview

This Activepieces community piece integrates with the [Dub REST API](https://dub.co/docs/api-reference/introduction) to let you:

- **Create** short links with full UTM/metadata support  
- **Retrieve** a single link by ID, external ID, or domain+key  
- **List** links in your workspace with filtering and pagination  
- **Update** any link property  
- **Delete** links permanently  
- **Trigger** workflows on real-time Dub events (`link.clicked`, `link.created`)

---

## Authentication

Dub uses **API key authentication** (Bearer token). You'll need an API key from your Dub workspace.

### Getting an API Key

1. Open [https://app.dub.co/settings/tokens](https://app.dub.co/settings/tokens)
2. Click **Create API Key**
3. Give it a name and select these scopes:
   - `links.read` — required for Get Link, List Links
   - `links.write` — required for Create, Update, Delete Link
   - `webhooks.write` — required for webhook triggers
4. Copy the key — it starts with `dub_xxxxxxxxx`
5. Paste it into the Activepieces **Dub** connection dialog

---

## Actions

| Action | Description |
|--------|-------------|
| **Create Link** | Create a new short link with optional UTM params, geo-targeting, expiry, password, and more |
| **Get Link** | Retrieve a link by Dub ID, external ID, or domain+key |
| **List Links** | List workspace links with domain, tag, and search filters |
| **Update Link** | Patch any link field — URL, slug, tags, expiry, UTM params, etc. |
| **Delete Link** | Permanently delete a link |
| **Custom API Call** | Call any Dub API endpoint with pre-configured auth |

---

## Triggers

| Trigger | Description |
|---------|-------------|
| **Link Clicked** | Fires in real time when a short link is clicked. Optionally filter to a specific link ID. |
| **Link Created** | Fires in real time when a new short link is created in your workspace. |

Triggers use Dub's native webhook infrastructure. Activepieces automatically registers the webhook when the trigger is enabled and removes it when disabled.

### Webhook Payload — Link Clicked

```json
{
  "id": "evt_abc123",
  "event": "link.clicked",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "data": {
    "link": {
      "id": "clv3g2xyz",
      "domain": "dub.sh",
      "key": "my-promo",
      "url": "https://example.com/landing",
      "shortLink": "https://dub.sh/my-promo",
      "clicks": 42
    },
    "click": {
      "id": "click_abc",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "country": "US",
      "city": "San Francisco",
      "device": "Desktop",
      "browser": "Chrome",
      "os": "macOS",
      "referer": "https://twitter.com"
    }
  }
}
```

---

## Development Setup

This piece follows the [Activepieces community piece development guide](https://www.activepieces.com/docs/developers/piece-reference/overview).

### Prerequisites

- Node.js ≥ 18
- pnpm (used in the Activepieces monorepo)
- The [Activepieces monorepo](https://github.com/activepieces/activepieces) cloned locally

### Local Development

1. **Clone the Activepieces repo:**
   ```bash
   git clone https://github.com/activepieces/activepieces.git
   cd activepieces
   ```

2. **Copy this piece into the community directory:**
   ```bash
   cp -r /path/to/activepieces-dub-piece packages/pieces/community/dub
   ```

3. **Register the piece** in `packages/pieces/community/index.ts`:
   ```typescript
   export { dub } from './dub/src';
   ```

4. **Install dependencies:**
   ```bash
   pnpm install
   ```

5. **Build the piece:**
   ```bash
   cd packages/pieces/community/dub
   pnpm build
   ```

6. **Start Activepieces with hot reload:**
   ```bash
   cd ../../../..
   pnpm dev
   ```

The Dub piece will appear in the Activepieces UI under Marketing / Analytics.

---

## Contributing

This piece was built for the [Algora MCP Challenge](https://algora.io/challenges). Contributions welcome!

1. Fork the [Activepieces repo](https://github.com/activepieces/activepieces)
2. Create a branch: `git checkout -b feat/dub-piece-improvement`
3. Make your changes following the existing code style
4. Open a PR against `activepieces/activepieces:main`
5. Reference the Algora bounty in your PR description

### Adding More Actions

Other Dub API endpoints worth implementing:

- **Get Analytics** — `GET /analytics` — retrieve click/lead/sale analytics
- **Bulk Create Links** — `POST /links/bulk` — create up to 100 links at once
- **Bulk Update Links** — `PATCH /links/bulk` — update up to 100 links at once
- **Create QR Code** — generate a QR code for a link
- **List Tags** — `GET /tags` — list workspace tags
- **Create Tag** — `POST /tags` — create a new tag
- **List Domains** — `GET /domains` — list workspace domains
- **Track Lead** — `POST /track/lead` — track a conversion lead event
- **Track Sale** — `POST /track/sale` — track a sale event

### Adding More Triggers

Dub supports these additional webhook event types:

- `link.updated` — fires when a link is updated
- `link.deleted` — fires when a link is deleted
- `lead.created` — fires when a lead conversion is tracked
- `sale.created` — fires when a sale conversion is tracked

---

## Resources

- [Dub API Reference](https://dub.co/docs/api-reference/introduction)
- [Dub Webhooks Guide](https://dub.co/blog/introducing-webhooks)
- [Activepieces Piece Development Guide](https://www.activepieces.com/docs/developers/piece-reference/overview)
- [Activepieces GitHub](https://github.com/activepieces/activepieces)

---

## License

MIT — see [LICENSE](../../../LICENSE) in the Activepieces monorepo root.
