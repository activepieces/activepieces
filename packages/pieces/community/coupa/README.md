# Coupa

[Coupa](https://www.coupa.com/) is a business spend management (BSM) platform. This piece automates procurement, approvals, purchase orders, and ERP integrations through the Coupa Core API.

## Authentication

Connect using an OAuth 2.0 / OpenID Connect client with the **Client Credentials** grant. In Coupa, go to **Setup → Integrations → OAuth2/OpenID Connect Clients**, create a client, and copy the Client ID and Client Secret. Provide the space-separated scopes your client was granted (e.g. `core.purchase_order.read core.purchase_order.write`).

## Actions

- **Create / Update / Get / Search Object** — generic CRUD against Purchase Orders, Suppliers, Contracts, or any custom resource.
- **Cancel / Close Purchase Order** — manage the purchase order lifecycle.
- **Grant / Reject Approval** — act on pending approvals.
- **Add File Attachment to Object** — attach a file or a URL to a record.
- **Get Remit-To Addresses** — list remit-to addresses for a supplier or a purchase order's supplier.
- **Get Supplier Sites** — list a supplier's sites.
- **Set Integration Run Status** — update an integration run (`run`, `success`, `fail`, `pause`, `pending`).
- **Custom API Call** — call any Coupa Core API endpoint directly.

## Triggers

- **New or Updated Object** — polls for created or updated Purchase Orders, Suppliers, or Contracts.

## API surface

This piece targets the Coupa Core API at `https://{your-instance}.coupahost.com/api`, authenticating against `https://{your-instance}.coupahost.com/oauth2/token`.
