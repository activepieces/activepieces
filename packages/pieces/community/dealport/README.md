# Dealport Piece for Activepieces

Dealport is the SMB knowledge layer for agents and humans, indexing 28M+ US private companies, commercial and multifamily buildings, primary public-filing citations, living Projects, Playbooks, and verified human owner contacts.

## Authentication

Create a scoped workspace API key (`dp_live_...`) at [Dealport Connect](https://app.dealport.com/connect?tab=keys). New pay-as-you-go API accounts start with a `$5.00` free balance.

## Actions & Plain-USD Rates

- **Preview Market ($0.00)** (`preview-companies`): Size a US company market and inspect 5 sample companies (`POST /api/v1/companies/preview`, `$0.00`).
- **Search Companies** (`search-companies`): Search 28M+ US private companies (`GET /api/v1/companies`, `$0.01` per new Record, `$0.00` repeat within 30 days).
- **Search Commercial Buildings** (`search-buildings`): Search NYC multifamily and mixed-use buildings (`GET /api/v1/buildings`, `$0.01` per new Record).
- **Get Cited Record** (`get-record`): Open a cited company Record (UUID) or NYC building Record (10-digit BBL) (`GET /api/v1/records/{id}`, `$0.01` per new Record).
- **Find Verified Owner** (`find-owner`): Resolve verified human owner phones, emails, and professional profile (`POST /api/v1/owners`, `$0.09` per verified hit, `$0.00` miss).
- **Find Contact by Role** (`find-contact`): Find verified principal contacts (`POST /api/v1/contacts`, `$0.09` per verified hit, `$0.00` miss).
- **Match Company List ($0.00)** (`match-company-list`): Match CSV or JSON company lists against 28M+ US company Records (`POST /api/v1/companies/match`, `$0.00`).
- **Custom API Call** (`custom_api_call`): Send authenticated requests to any Dealport API v1 endpoint on `https://app.dealport.com/api/v1`.
