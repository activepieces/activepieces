# Loops Piece for Activepieces

Send transactional and marketing emails, manage contacts, and trigger automations using [Loops](https://loops.so) — the modern email platform built for SaaS teams.

## Authentication

Generate an API key at **[Settings → API](https://app.loops.so/settings?page=api)** in your Loops dashboard and paste it into the **API Key** field when connecting the piece.

The key is validated on connection by calling `GET /api/v1/api-key`.

---

## Actions

### 1. Create or Update Contact

Creates a new contact, or updates their properties if a contact with that email already exists.

| Property | Required | Description |
|---|---|---|
| Email | ✅ | Contact's email address |
| First Name | — | Contact's first name |
| Last Name | — | Contact's last name |
| User ID | — | Your internal user ID |
| Subscribed to Marketing | — | Whether to include in marketing campaigns (default: true) |
| User Group | — | Segment/group label |
| Source | — | How the contact was acquired |
| Custom Properties | — | Any extra flat key-value properties |

---

### 2. Send Event

Sends a named event to Loops for a contact. Events can trigger email automations configured in your Loops dashboard.

| Property | Required | Description |
|---|---|---|
| Event Name | ✅ | e.g. `signup`, `purchase`, `password-reset` |
| Email | — | Contact identifier (email or userId required) |
| User ID | — | Contact identifier (email or userId required) |
| Event Properties | — | Key-value data attached to the event |
| Contact Properties | — | Contact property updates applied alongside the event |

---

### 3. Send Transactional Email

Sends a transactional email to a recipient using a pre-built Loops template.

| Property | Required | Description |
|---|---|---|
| To Email | ✅ | Recipient email address |
| Transactional Email ID | ✅ | Template ID from your Loops dashboard |
| Add to Audience | — | Add recipient as a contact if not already (default: false) |
| Data Variables | — | Dynamic variables to populate in the template |

---

### 4. Find Contact

Finds a contact in Loops by email or user ID.

| Property | Required | Description |
|---|---|---|
| Email | — | Look up by email (email or userId required) |
| User ID | — | Look up by your internal user ID |

Returns an array of matching contacts and a count.

---

### 5. Delete Contact

Permanently deletes a contact from Loops.

| Property | Required | Description |
|---|---|---|
| Email | — | Contact to delete (email or userId required) |
| User ID | — | Contact to delete by internal user ID |

---

### 6. Custom API Call

Make any authenticated API call to the Loops REST API that isn't covered by the above actions. The base URL (`https://app.loops.so/api/v1`) and `Authorization` header are set automatically.

---

## Loops API Reference

Full API docs: [https://loops.so/docs/api-reference/intro](https://loops.so/docs/api-reference/intro)

- Base URL: `https://app.loops.so/api/v1`
- Auth: `Authorization: Bearer <API_KEY>`
- Rate limit: 10 requests/second per team

---

## Contributing

Authors: **Harmatta**

Please follow [Activepieces contribution guidelines](https://www.activepieces.com/docs/contributing/overview) when opening a PR.
