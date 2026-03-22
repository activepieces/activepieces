# Activepieces Piece — Fathom Analytics

Privacy-focused website analytics integration for [Activepieces](https://activepieces.com).

Built for the **Algora MCP Challenge** — $200 per merged piece.

## Overview

[Fathom Analytics](https://usefathom.com) is a GDPR-compliant, privacy-first website analytics platform. This piece lets you automate workflows using your Fathom account data — pull traffic reports, manage sites, create goals, and build custom dashboards with zero code.

## Authentication

Fathom uses **API token** authentication.

1. Go to [https://app.usefathom.com/api](https://app.usefathom.com/api)
2. Click **Create new**
3. Name your token and set permissions (Admin, Read Only, or site-specific)
4. Copy the token — **it won't be shown again**
5. Paste it into the Activepieces connection dialog

**Rate limits:**
- 2,000 requests/hour for Sites & Events endpoints
- 10 requests/minute for Aggregations

## Available Actions

### List Sites
Return a list of all sites this API key has access to. Supports cursor-based pagination.

**Inputs:**
- `Limit` — Number of results (1–100, default 10)
- `Starting After` — Cursor for forward pagination
- `Ending Before` — Cursor for backward pagination

---

### Get Site
Retrieve details for a specific site by its ID.

**Inputs:**
- `Site ID` *(required)* — The Fathom site identifier (e.g., `CDBUGS`)

---

### Create Event
Create a custom event (goal) for tracking conversions on a site.

**Inputs:**
- `Site ID` *(required)* — The Fathom site ID
- `Event Name` *(required)* — Name for the goal (e.g., "Signup", "Purchase")

---

### List Events
List all custom events (goals) for a site. Supports cursor pagination.

**Inputs:**
- `Site ID` *(required)* — The Fathom site ID
- `Limit` — Results per page (1–100)
- `Starting After` / `Ending Before` — Pagination cursors

---

### Get Aggregation
Generate a flexible custom analytics report. Group by time, filter by path, and choose your metrics.

**Inputs:**
- `Site ID` *(required)* — Fathom site ID
- `Entity Type` *(required)* — `pageview` or `event`
- `Aggregates` *(required)* — Metrics: `pageviews`, `visits`, `uniques`, `avg_duration`, `bounce_rate`
- `Date Grouping` — `hour`, `day`, `month`, or `year`
- `Date From` / `Date To` — ISO 8601 date range
- `Sort By` — e.g., `pageviews:desc`
- `Limit` — Max results
- `Filters` — JSON array of filter objects

**Example filter:**
```json
[{"property": "pathname", "operator": "is", "value": "/blog"}]
```

---

### Custom API Call
Make any call to the Fathom API not covered by the above actions. Uses your API token automatically.

## Example Use Cases

- **Weekly traffic digest** — Schedule a flow to pull site aggregations and post to Slack every Monday
- **Goal tracking** — Create Fathom events when users complete key actions tracked in other tools
- **Dashboard automation** — Combine Fathom data with Google Sheets for custom reporting
- **New site provisioning** — Auto-register new sites in Fathom when projects are created in Notion/Linear

## API Reference

- [Fathom API Docs](https://usefathom.com/api)
- [Fathom Developer Portal](https://developers.fathom.ai)

## Development

```bash
# Install dependencies (from activepieces monorepo root)
npm install

# Build
cd packages/pieces/community/fathom-analytics
npm run build

# Lint
npm run lint
```

## License

MIT — Contributed to the Activepieces community.
