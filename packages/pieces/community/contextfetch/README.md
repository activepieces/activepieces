# ContextFetch

## Description
[ContextFetch](https://contextfetch.dev) is a web search and page contents API for AI agents. This piece searches the web and fetches pages as Markdown.

## Actions
1. **Search**: Search the web for a query
   - Optional page content per result: full text as Markdown, highlights, or pruned context (only the passages relevant to the query)
   - Include or exclude domains, and a published-after date
2. **Get Contents**: Fetch one or more pages (up to 10) as Markdown
   - Optional highlights and pruned context for a query
   - Pages that fail to load are listed in `statuses`
3. **Custom API Call**: Call any other ContextFetch endpoint with the connection's key

## Authentication
This piece needs a ContextFetch API key:
1. Get a free key with 2,500 credits: `curl -X POST https://api.contextfetch.dev/v1/keys/free` (one per network, no signup), or buy credits at https://contextfetch.dev/pricing
2. Paste the key into the connection. It is checked against `GET /v1/balance`.

API docs: https://contextfetch.dev/docs
