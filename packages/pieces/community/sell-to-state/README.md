# Sell to State

Government tenders and contract awards from official procurement sources in 60+ countries, from [Sell to State](https://selltostate.com).

## Auth

API key from [app.selltostate.com/account/keys](https://app.selltostate.com/account/keys). Data needs an active plan. The key goes in the `x-api-key` header.

## Actions

- **Search Tenders**: text, country (one or more slugs), accepts bids only, lifecycle, sort (relevance, nearest deadline, newest published, newest in Sell to State).
- **Find Suppliers**: companies that won contracts about a subject, or one company by name.
- **Get Buyer Profile**: spend by year, sectors, top suppliers of one public buyer.
- **Get Supplier Profile**: awards by year, sectors, top buyers of one supplier.
- **Custom API Call**: any endpoint of `https://app.selltostate.com/api/v1` ([docs](https://docs.selltostate.com)).

## Triggers

- **New Tender**: polls `GET /api/v1/search` with `sort=added_desc` and keeps the last seen tender slug (`LAST_ITEM`).
