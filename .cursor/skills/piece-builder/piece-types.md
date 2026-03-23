# Piece Types & Classifications

## The 3 Piece Locations

The monorepo has three piece directories, each with a different purpose:

```
packages/pieces/
  community/    ← third-party integrations (Slack, Stripe, GitHub, etc.)
  core/         ← built-in Activepieces utilities (HTTP, Store, Schedule, etc.)
  custom/       ← private pieces built by individual Activepieces customers
```

### When to use each

| Location | Use when | Examples |
|---|---|---|
| `community/` | Building an integration for a third-party app that anyone can use | Slack, Notion, Trello, Stripe |
| `core/` | Building a platform utility that is not specific to any external app | HTTP, Store, Math Helper, Delay |
| `custom/` | Building a private piece for a specific customer's internal system | Internal CRM, proprietary API |

**For almost all piece building work, you will use `community/`.** The CLI scaffolds into `community/` by default.
---

## Piece Type Enum (runtime)

At runtime, pieces are classified as either `OFFICIAL` or `CUSTOM`:

```typescript
enum PieceType {
  CUSTOM = 'CUSTOM',    // private pieces, uploaded as .tgz archives
  OFFICIAL = 'OFFICIAL', // published to npm registry (@activepieces/piece-*)
}
```

Community and core pieces are `OFFICIAL` (published to npm). Custom pieces are `CUSTOM` (uploaded as archives to a specific platform/account).

---

## Package Naming Convention

| Location | Package name format | Example |
|---|---|---|
| `community/` | `@activepieces/piece-<name>` | `@activepieces/piece-slack` |
| `core/` | `@activepieces/piece-<name>` | `@activepieces/piece-http` |
| `custom/` | Any npm-valid name | `@mycompany/piece-internal-crm` |

---

## PieceCategory Values

Use `PieceCategory` from `@activepieces/shared` to classify your piece. Pick the most relevant category:

| Category | Use for |
|---|---|
| `ARTIFICIAL_INTELLIGENCE` | AI/LLM services (OpenAI, Anthropic, etc.) |
| `COMMUNICATION` | Chat, email, messaging (Slack, Gmail, Twilio) |
| `COMMERCE` | E-commerce platforms (Shopify, WooCommerce) |
| `ACCOUNTING` | Finance/accounting tools (QuickBooks, Xero) |
| `BUSINESS_INTELLIGENCE` | Analytics, reporting (Google Analytics, Looker) |
| `CONTENT_AND_FILES` | File storage, docs (Google Drive, Notion, Dropbox) |
| `DEVELOPER_TOOLS` | Dev tools (GitHub, Jira, Linear) |
| `CUSTOMER_SUPPORT` | Support platforms (Intercom, Zendesk) |
| `FORMS_AND_SURVEYS` | Form builders (Typeform, Google Forms) |
| `HUMAN_RESOURCES` | HR tools (BambooHR, Workday) |
| `MARKETING` | Marketing tools (Mailchimp, HubSpot Marketing) |
| `PAYMENT_PROCESSING` | Payment gateways (Stripe, PayPal) |
| `PRODUCTIVITY` | General productivity (Trello, Airtable, Calendar) |
| `SALES_AND_CRM` | CRM/Sales (Salesforce, HubSpot CRM, Pipedrive) |
| `CORE` | Platform utilities (for `core/` pieces only) |
| `FLOW_CONTROL` | Flow logic (for `core/` pieces only) |
| `UNIVERSAL_AI` | Universal AI connectors (for `core/` pieces only) |

Multiple categories allowed:
```typescript
categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING]
```

---

## Core Pieces — What's Available

Core pieces are utilities built into the Activepieces platform. Do NOT recreate these -- use them as references for patterns:

| Piece | Package | What it does |
|---|---|---|
| `http` | `@activepieces/piece-http` | Generic HTTP requests |
| `store` | `@activepieces/piece-store` | Key-value storage within flows |
| `schedule` | `@activepieces/piece-schedule` | Cron-based scheduling trigger |
| `delay` | `@activepieces/piece-delay` | Pause flow execution |
| `webhook` | `@activepieces/piece-webhook` | Generic webhook trigger |
| `manual-trigger` | `@activepieces/piece-manual-trigger` | Manual flow execution |
| `data-mapper` | `@activepieces/piece-data-mapper` | Transform/map data |
| `math-helper` | `@activepieces/piece-math-helper` | Math operations |
| `text-helper` | `@activepieces/piece-text-helper` | String operations |
| `date-helper` | `@activepieces/piece-date-helper` | Date/time operations |
| `file-helper` | `@activepieces/piece-file-helper` | File operations |
| `approval` | `@activepieces/piece-approval` | Human approval steps |
| `smtp` | `@activepieces/piece-smtp` | Send emails via SMTP |
| `sftp` | `@activepieces/piece-sftp` | SFTP file transfers |
| `csv` | `@activepieces/piece-csv` | CSV parsing/generation |
| `pdf` | `@activepieces/piece-pdf` | PDF generation |
| `qrcode` | `@activepieces/piece-qrcode` | QR code generation |
| `tables` | `@activepieces/piece-tables` | Activepieces Tables integration |
| `subflows` | `@activepieces/piece-subflows` | Call other flows |
| `connections` | `@activepieces/piece-connections` | Manage connections |
| `forms` | `@activepieces/piece-forms` | Activepieces Forms |
| `tags` | `@activepieces/piece-tags` | Flow tagging |
| `graphql` | `@activepieces/piece-graphql` | Generic GraphQL requests |
| `crypto` | `@activepieces/piece-crypto` | Cryptography utilities |
| `xml` | `@activepieces/piece-xml` | XML parsing |
| `image-helper` | `@activepieces/piece-image-helper` | Image processing |
