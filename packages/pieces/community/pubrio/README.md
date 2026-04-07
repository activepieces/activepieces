# @activepieces/piece-pubrio

Activepieces piece for [Pubrio](https://pubrio.com) — the glocalized business data layer for AI agents and revenue teams. Search the whole market, not just the 30% in mainstream datasets.

## Actions

| Action | Description |
|--------|-------------|
| Search Companies | Search companies by name, domain, location, industry, technology, headcount |
| Lookup Company | Look up a company by domain or LinkedIn URL |
| Enrich Company | Enrich company with full firmographic data (uses credits) |
| Search People | Search people by name, title, department, seniority, company |
| Lookup Person | Look up a person by LinkedIn URL |
| Enrich Person | Enrich person with full professional details (uses credits) |
| Reveal Contact | Reveal email or phone for a person (uses credits) |
| Search Jobs | Search job postings across companies |
| Search News | Search company news and press releases |
| Find Similar Companies | Find companies similar to a given company |
| Lookup Technology | Look up technologies used by a company |

## Triggers

| Trigger | Description |
|---------|-------------|
| Monitor Event | Webhook trigger for Pubrio monitor events |

## How to Submit

This piece is designed to be submitted as a PR to the [Activepieces monorepo](https://github.com/activepieces/activepieces):

1. Fork `activepieces/activepieces`
2. Copy this directory to `packages/pieces/community/pubrio/`
3. Register the piece in `packages/pieces/community/index.ts`
4. Submit a PR following the [contribution guide](https://www.activepieces.com/docs/contributing/overview)

## Authentication

Get your API key from [dashboard.pubrio.com](https://dashboard.pubrio.com) under Settings.

## License

MIT
