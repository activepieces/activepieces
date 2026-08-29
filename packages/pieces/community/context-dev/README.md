# Context.dev piece (`@activepieces/piece-context-dev`)

Live web data and brand intelligence for Activepieces workflows.

## Connection setup

Create or copy an API key from the [Context.dev dashboard](https://www.context.dev/dashboard), then
paste it into the piece connection. Validation calls the monitor-limits endpoint, which does not use
credits.

## Actions

| Action                  | Endpoint                      | Purpose                                                          |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Search Web              | `POST /v1/web/search`         | Find live web results with optional page Markdown                |
| Scrape URL              | `GET /v1/web/scrape/markdown` | Convert one known page into Markdown                             |
| Crawl Website           | `POST /v1/web/crawl`          | Retrieve linked pages as Markdown                                |
| Find Website Pages      | `GET /v1/web/scrape/sitemap`  | Discover and optionally topic-rank sitemap URLs                  |
| Extract Structured Data | `POST /v1/web/extract`        | Fill a caller-provided JSON schema from website content          |
| Get Brand Profile       | `POST /v1/brand/retrieve`     | Retrieve logos, colors, links, and company details               |
| Custom API Call         | any                           | Call another Context.dev v1 endpoint with the connection API key |

Searches and list actions return flat rows. Dynamic extraction and brand responses default
to flattened fields and also offer the complete raw API response.

## Development

```bash
npx turbo run build --filter=@activepieces/piece-context-dev
npx turbo run lint --filter=@activepieces/piece-context-dev
npx turbo run test --filter=@activepieces/piece-context-dev
```
