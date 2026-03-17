# QuickBooks Piece for Activepieces

Integrate your QuickBooks Online accounting with Activepieces automations. Create customers, manage invoices, record payments, and trigger workflows when financial events occur.

## Authentication

QuickBooks uses **OAuth 2.0**. To connect:

1. Go to the [Intuit Developer Portal](https://developer.intuit.com/app/developer/homepage).
2. Sign in and click **Create an App**.
3. Choose **QuickBooks Online and Payments** as the platform.
4. Under **Keys & OAuth** → **Redirect URIs**, add the OAuth callback URL from Activepieces.
5. Copy the **Client ID** and **Client Secret** — you'll need these when connecting in Activepieces.

**Required Scopes:**
- `com.intuit.quickbooks.accounting` — read/write access to accounting data

### Finding Your Company ID (Realm ID)

Your Realm ID is the company identifier used in API calls. To find it:
- Log into QuickBooks Online
- Look at the URL: `https://app.qbo.intuit.com/app/homepage?&realmid=**XXXXXXXXX**`
- The number after `realmid=` is your Company ID

---

## Triggers

### 🔔 New Customer
Fires when a new customer is created in QuickBooks.

**Outputs:** Full customer object including ID, name, email, phone, address, and balance.

**Use case:** When a new customer is added, automatically create them in your CRM or send a welcome email.

### 🔔 New Invoice
Fires when a new invoice is created in QuickBooks.

**Outputs:** Full invoice object including ID, customer, line items, total, due date.

**Use case:** Automatically notify your team in Slack or send a follow-up email when an invoice is created.

### 🔔 Payment Received
Fires when a customer payment is recorded in QuickBooks.

**Outputs:** Full payment object including customer, amount, date, and linked invoices.

**Use case:** When payment is received, auto-update your CRM, send a thank-you email, or update a revenue tracker.

---

## Actions

### ✍️ Create Customer
Creates a new customer record in QuickBooks.

**Inputs:**
| Field | Required | Description |
|-------|----------|-------------|
| Company ID | ✅ | Your QuickBooks Realm ID |
| Display Name | ✅ | Unique name for the customer |
| First Name | ❌ | Customer's first name |
| Last Name | ❌ | Customer's last name |
| Company Name | ❌ | Business name |
| Email | ❌ | Primary email address |
| Phone | ❌ | Primary phone number |
| Billing Address | ❌ | Street, city, state, postal, country |

### ✍️ Create Invoice
Creates a new invoice in QuickBooks for a customer.

**Inputs:**
| Field | Required | Description |
|-------|----------|-------------|
| Company ID | ✅ | Your QuickBooks Realm ID |
| Customer ID | ✅ | QuickBooks Customer ID |
| Line Items | ✅ | JSON array of items/services (see below) |
| Invoice Date | ❌ | Date created (YYYY-MM-DD) |
| Due Date | ❌ | Payment due date (YYYY-MM-DD) |
| Invoice Number | ❌ | Custom doc number |
| Customer Memo | ❌ | Visible note on invoice |
| Send Email To | ❌ | Auto-sends invoice to this email |

**Line Items Format:**
```json
[
  {
    "Description": "Consulting Services",
    "Amount": 500.00,
    "Qty": 5,
    "UnitPrice": 100.00,
    "ItemRef": "1"
  }
]
```

### ✍️ Create Payment
Records a customer payment in QuickBooks.

**Inputs:**
| Field | Required | Description |
|-------|----------|-------------|
| Company ID | ✅ | Your QuickBooks Realm ID |
| Customer ID | ✅ | QuickBooks Customer ID |
| Total Amount | ✅ | Payment amount |
| Payment Date | ❌ | Date (YYYY-MM-DD) |
| Payment Reference | ❌ | Check number or transaction ID |
| Deposit Account ID | ❌ | Account to deposit into |
| Apply to Invoice IDs | ❌ | Link payment to specific invoices |

### 🔍 Get Customer
Retrieves a customer by their QuickBooks ID.

### 🔍 Get Invoice
Retrieves an invoice by its QuickBooks ID.

### 🔍 Find Customer
Searches for customers by name, company, or email.

### 🔍 Find Invoice
Searches for invoices by customer, invoice number, date range, or unpaid status.

---

## Sandbox Testing

All actions and triggers support a **Use Sandbox** toggle. When enabled, requests are routed to:
```
https://sandbox-quickbooks.api.intuit.com/v3
```

To test:
1. Create a sandbox company at [developer.intuit.com](https://developer.intuit.com/app/developer/homepage)
2. Enable **Use Sandbox** in each action/trigger
3. Use your sandbox company's Realm ID

---

## API Reference

- [QuickBooks Online API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/account)
- [QuickBooks Developer Portal](https://developer.intuit.com/)
- [QuickBooks Query Language](https://developer.intuit.com/app/developer/qbo/docs/develop/explore-the-quickbooks-online-api/data-queries)
- [OAuth 2.0 for QuickBooks](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
