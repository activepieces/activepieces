# @activepieces/piece-pubrio

Activepieces piece for [Pubrio](https://pubrio.com) — the glocalized business data layer for AI agents and revenue teams. Search the whole market, not just the 30% in mainstream datasets.

## Actions (51)

### Company (6)

| Action | Description |
|--------|-------------|
| Search Companies | Search companies by name, domain, location, industry, technology, headcount, and more |
| Lookup Company | Look up a company by domain, LinkedIn URL, or ID |
| Enrich Company | Enrich company with full firmographic data (uses credits) |
| LinkedIn Company Lookup | Real-time LinkedIn company lookup |
| Find Similar Companies | Find lookalike companies with filters for location, industry, technology, headcount, and more |
| Lookup Technology | Look up technologies used by a company |

### Signals (7)

| Action | Description |
|--------|-------------|
| Search Jobs | Search job postings across companies by title, location, keyword, and date |
| Lookup Job | Look up detailed information about a specific job posting |
| Search News | Search company news and press releases by category, language, gallery, and date |
| Lookup News | Look up detailed information about a specific news article |
| Search Ads | Search company advertisements by keyword, headline, target location, and date range |
| Lookup Advertisement | Look up detailed information about a specific advertisement |
| Lookup Lookalike | Look up a similar/lookalike company result |

### People (7)

| Action | Description |
|--------|-------------|
| Search People | Search people by name, title, department, seniority, location, company, and more |
| Lookup Person | Look up a person by LinkedIn URL or people_search_id |
| LinkedIn Person Lookup | Real-time LinkedIn person lookup |
| Enrich Person | Enrich person with full professional details (uses credits) |
| Reveal Contact | Reveal email (work/personal) or phone for a person (uses credits) |
| Batch Redeem Contacts | Reveal contact details for multiple people at once (uses credits) |
| Query Batch Redeem | Check the status and results of a batch contact redeem operation |

### Reference Data (14)

| Action | Description |
|--------|-------------|
| Get Locations | Get all available location codes for search filters |
| Get Departments | Get all department title codes for people search filters |
| Get Department Functions | Get all department function codes for people search filters |
| Get Management Levels | Get all management/seniority level codes for people search filters |
| Get Company Sizes | Get all company size range codes for search filters |
| Get Timezones | Get all available timezone codes |
| Get News Categories | Get all news category codes for news search filters |
| Get News Galleries | Get all news gallery codes for news search filters |
| Get News Languages | Get all news language codes for news search filters |
| Search Technologies | Search for technology names by keyword |
| Search Technology Categories | Search for technology category names by keyword |
| Search Verticals | Search for industry vertical names by keyword |
| Search Vertical Categories | Search for vertical category names by keyword |
| Search Vertical Sub-Categories | Search for vertical sub-category names by keyword |

### Monitors (14)

| Action | Description |
|--------|-------------|
| Create Monitor | Create a new signal monitor for jobs, news, or advertisements |
| Update Monitor | Update an existing signal monitor configuration |
| Get Monitor | Get detailed information about a specific monitor |
| List Monitors | List all signal monitors with pagination |
| Delete Monitor | Permanently delete a signal monitor |
| Duplicate Monitor | Create a copy of an existing monitor |
| Test Run Monitor | Execute a test run of a monitor to preview triggers |
| Retry Monitor | Retry a failed monitor trigger by log ID |
| Validate Webhook | Test a webhook destination configuration |
| Get Monitor Stats | Get aggregate statistics across all monitors |
| Get Monitor Chart | Get daily trigger statistics for a monitor over a date range |
| Get Monitor Logs | Get trigger logs for a specific monitor |
| Get Monitor Log Detail | Look up detailed information about a specific monitor log entry |
| Reveal Monitor Signature | Reveal the webhook signature secret for a monitor |

### Profile (3)

| Action | Description |
|--------|-------------|
| Get Profile | Get full profile information for the authenticated account |
| Get Usage | Get credit usage and subscription information |
| Get User | Get current authenticated user details |

## Triggers

| Trigger | Description |
|---------|-------------|
| Monitor Event | Webhook trigger for Pubrio monitor events |

## Authentication

Get your API key from [dashboard.pubrio.com](https://dashboard.pubrio.com) under Settings.

## License

MIT
