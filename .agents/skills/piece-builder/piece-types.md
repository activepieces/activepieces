# Piece Types & Classifications

## Locations

| Location | Use when | Examples |
|---|---|---|
| `community/` | Third-party integration anyone can use | Slack, Notion, Stripe |
| `core/` | Built-in platform utility, not app-specific | HTTP, Store, Math Helper |
| `custom/` | Private piece for a specific customer | Internal CRM, proprietary API |

Use `community/` for almost all work.

## Package Naming

| Location | Format | Example |
|---|---|---|
| `community/` | `@activepieces/piece-<name>` | `@activepieces/piece-slack` |
| `core/` | `@activepieces/piece-<name>` | `@activepieces/piece-http` |
| `custom/` | Any npm-valid name | `@mycompany/piece-crm` |

## PieceCategory Values

```typescript
import { PieceCategory } from '@activepieces/shared';
```

| Category | Use for |
|---|---|
| `ARTIFICIAL_INTELLIGENCE` | AI/LLM services (OpenAI, Anthropic) |
| `COMMUNICATION` | Chat, email, messaging (Slack, Gmail, Twilio) |
| `COMMERCE` | E-commerce (Shopify, WooCommerce) |
| `ACCOUNTING` | Finance/accounting (QuickBooks, Xero) |
| `BUSINESS_INTELLIGENCE` | Analytics, reporting (Google Analytics) |
| `CONTENT_AND_FILES` | Files, docs (Google Drive, Notion, Dropbox) |
| `DEVELOPER_TOOLS` | Dev tools (GitHub, Jira, Linear) |
| `CUSTOMER_SUPPORT` | Support (Intercom, Zendesk) |
| `FORMS_AND_SURVEYS` | Forms (Typeform, Google Forms) |
| `HUMAN_RESOURCES` | HR tools (BambooHR, Workday) |
| `MARKETING` | Marketing (Mailchimp, HubSpot Marketing) |
| `PAYMENT_PROCESSING` | Payments (Stripe, PayPal) |
| `PRODUCTIVITY` | General productivity (Trello, Airtable) |
| `SALES_AND_CRM` | CRM/Sales (Salesforce, HubSpot CRM) |
| `CORE` | Platform utilities (core/ pieces only) |
| `FLOW_CONTROL` | Flow logic (core/ pieces only) |
| `UNIVERSAL_AI` | Universal AI connectors (core/ pieces only) |

Multiple categories allowed: `categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING]`

## Core Pieces — Do Not Recreate

| Piece | What it does |
|---|---|
| `http` | Generic HTTP requests |
| `store` | Key-value storage within flows |
| `schedule` | Cron-based scheduling trigger |
| `delay` | Pause flow execution |
| `webhook` | Generic webhook trigger |
| `manual-trigger` | Manual flow execution |
| `data-mapper` | Transform/map data |
| `math-helper` | Math operations |
| `text-helper` | String operations |
| `date-helper` | Date/time operations |
| `file-helper` | File operations |
| `approval` | Human approval steps |
| `smtp` | Send emails via SMTP |
| `sftp` | SFTP file transfers |
| `csv` | CSV parsing/generation |
| `pdf` | PDF generation |
| `qrcode` | QR code generation |
| `tables` | Activepieces Tables integration |
| `subflows` | Call other flows |
| `connections` | Manage connections |
| `forms` | Activepieces Forms |
| `graphql` | Generic GraphQL requests |
| `crypto` | Cryptography utilities |
| `xml` | XML parsing |
| `image-helper` | Image processing |
