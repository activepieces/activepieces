# Pangolinfo

Official Activepieces integration for structured Amazon and AI search data. It contains six read-only actions and uses a secret API-key connection.

| Action | Product | Documentation |
| --- | --- | --- |
| Get Amazon Product | [Amazon Scraper API](https://www.pangolinfo.com/amazon-scraper-api/) | [Product API](https://docs.pangolinfo.com/en-api-reference/amazonApi/amazonScrapeAPI) |
| Search Amazon Products | [Amazon Scraper API](https://www.pangolinfo.com/amazon-scraper-api/) | [Keyword API](https://docs.pangolinfo.com/en-api-reference/amazonApi/amazonScrapeAPI) |
| Get Amazon Reviews | [Amazon Scraper API](https://www.pangolinfo.com/amazon-scraper-api/) | [Reviews API](https://docs.pangolinfo.com/en-api-reference/amazonReviewAPI/amazonReviewAPI) |
| Get Google AI Overview | [AI Overview SERP API](https://www.pangolinfo.com/ai-overview-serp-api/) | [AI Overview API](https://docs.pangolinfo.com/en-api-reference/aiModeSerpApi/aiModeSerpAPI) |
| Filter Amazon Niches | [Amazon Niche Data API](https://www.pangolinfo.com/amazon-niche-data-api/) | [Niche Filter API](https://docs.pangolinfo.com/en-api-reference/nicheFilterAPI/nicheFilterAPI) |
| Ask Amazon Alexa for Shopping | [Amazon Alexa API](https://www.pangolinfo.com/amazon-alexa-api/) | [Alexa API](https://docs.pangolinfo.com/en-api-reference/amazonAlexaAPI/amazonAlexaAPI) |

For MCP-native agents, see [Pangolinfo Amazon Data MCP](https://www.pangolinfo.com/amazon-data-mcp/) with 19 read-only ecommerce research tools.

## Building

Run `npx turbo run build --filter=@activepieces/piece-pangolinfo` to build the library.
