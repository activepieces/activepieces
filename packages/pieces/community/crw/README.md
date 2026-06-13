# pieces-crw

[fastCRW](https://fastcrw.com) is a Firecrawl-compatible web scraper that ships as a
single binary. Self-host (free, AGPL open core) or use the managed cloud. This piece
mirrors the Firecrawl piece and talks to the same Firecrawl-compatible REST API, so
you can scrape, crawl, map, search, and extract structured data from websites.

By default the piece targets the managed cloud at `https://fastcrw.com/api`. To point
it at a self-hosted instance, override `CRW_API_BASE_URL` in `src/lib/common/common.ts`.
Store your key under the `CRW_API_KEY` convention when configuring the connection.

## Building

Run `turbo run build --filter=@activepieces/piece-crw` to build the library.
