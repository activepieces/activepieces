# Desearch

Search the web and retrieve titles, links, and snippets with Desearch.

## Authentication

1. Sign in to your Desearch account at https://desearch.ai/.
2. Open the API key section and copy your API key.
3. Create a connection using the required **API Key** field.

Requests use the `Authorization: Bearer <API key>` header.

## Actions

- **Web Search**: Search with a required Query. Result Count defaults to 10, must be a positive integer, and is capped at 20. Returns a `data` array containing `title`, `link`, and `snippet` for each result.
- **Custom API Call**: Send authenticated requests to `https://api.desearch.ai`.

## Development

Package: `@activepieces/piece-desearch`, version `0.0.1`.

Run from this directory:

```sh
npm run build
npm run lint
npm test
```

Tests use mocked HTTP requests and require no API key or network access.
