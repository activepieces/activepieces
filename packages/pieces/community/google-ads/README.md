# Google Ads

Manage campaigns, ad groups, ads, keywords, audiences and performance reports in Google Ads through the
[Google Ads API](https://developers.google.com/google-ads/api) (v25) and, for Customer Match, the
[Data Manager API](https://developers.google.com/data-manager/api).

## Connection

Google OAuth2 with an OAuth client from your own Google Cloud project:

1. Enable the **Google Ads API** (and the **Data Manager API** if you use Customer Match) in the project.
2. Check the project's Google Ads API access level. New projects get *Test* access (test accounts only); apply for *Explorer* or *Basic* access to operate real accounts.
3. Add the `https://www.googleapis.com/auth/adwords` and `https://www.googleapis.com/auth/datamanager` scopes to the OAuth consent screen.
4. Create a *Web application* OAuth client with the redirect URL shown in the connection dialog, and paste the Client ID and Client Secret.

**Login Customer ID (Manager Account)** is optional: fill it with the manager (MCC) account ID when you reach client accounts through a manager.

## Actions

Records are one of five resources: campaign, ad group, ad, keyword or audience list.

| Action | Description |
| --- | --- |
| Create Record | Create a record from a JSON body in the REST API shape. Supports *Validate Only*. |
| Update Record | Change only the fields you send; the update mask is derived from them. Supports *Validate Only*. |
| Delete Record | Remove a record (Google marks it REMOVED; it cannot be restored). Supports *Validate Only*. |
| Search Records | Run a GAQL `SELECT` query, one page at a time or all pages up to a row cap. |
| Retrieve Advertising Report | Metrics per account, campaign, ad group, ad, keyword or search term over a date range, as flat rows. |
| Add Customer Match Data | Upload e-mails, phones or addresses (normalized and SHA-256 hashed before upload) to a CRM-based audience list. |
| Remove Customer Match Data | Remove members from a CRM-based audience list. |
| Custom API Call | Call any Google Ads API endpoint (or a Data Manager API endpoint by full URL, e.g. to check a Customer Match request) with the connection's credentials. |

## Triggers

| Trigger | Description |
| --- | --- |
| New Record | Polls the selected account for newly created records of the chosen type. Ads and keywords are detected from the account change history, which covers the last 30 days. Removed records are ignored. One change history query returns at most 10,000 rows and cannot be split below one ad group at one timestamp, so if a single ad group receives more than 10,000 ads or keywords at the same instant (more than one mutate request can create), only the first 10,000 fire and a warning is logged. |
