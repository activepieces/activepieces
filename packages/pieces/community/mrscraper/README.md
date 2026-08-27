# MrScraper

Use MrScraper to discover URLs, search Google, extract web data, run reusable scrapers, and retrieve results.

## Connection

1. Sign in to the [MrScraper app](https://app.mrscraper.com).
2. Create or copy an API token from your account.
3. Create a MrScraper connection in Activepieces and paste the token into **API Token**.

The token is stored in the reusable connection and must not be added to action properties.

## Actions

- **Account:** Get Account Info
- **Discovery:** Crawl Website URLs, Search Google SERP
- **Extraction:** Extract Page by Prompt, Extract Listings, Extract Structured Data, Fetch Rendered HTML
- **Results:** Get Results, Get Latest Results, Get Result Detail
- **Scraper Creation:** Create Prompt Scraper, Create Listing Scraper, Create Website Crawl Scraper
- **Scraper Runs:** Run Existing Scraper, Run Existing Scraper Batch

For example, extract a product page with a prompt and optional JSON output schema, discover a documentation site's URLs with the crawl action, or run an existing scraper over a batch of URLs and retrieve its latest results afterward. JSON responses remain structured objects or arrays. HTML responses remain strings.

Only scrape content you are authorized to access. Review the target website's terms and applicable laws before automating access.
