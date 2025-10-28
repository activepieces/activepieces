import { createAction, Property } from '@activepieces/pieces-framework';
import { scrapelessApiAuth } from '../../index';
import { createScrapelessClient } from '../services/scrapeless-api-client';

export const crawlScrapeApi = createAction({
  auth: scrapelessApiAuth,
  name: 'crawl_scrape',
  displayName: 'Scrape Webpage Data',
  description: 'Extracts data from a single webpage.',


  props: {
    url: Property.ShortText({
      displayName: 'URL to Crawl',
      description: 'The URL of the webpage to scrape.',
      required: true,
    })
  },
  async run({ propsValue, auth }) {
    try {
      const client = createScrapelessClient(auth);

      const url = propsValue.url;
      const browserOptions = {
        "proxy_country": "ANY",
        "session_name": "Crawl",
        "session_recording": true,
        "session_ttl": 900,
      }

      const response = await client.scrapingCrawl.scrape.scrapeUrl(url, {
        browserOptions
      })

      if (response.status === 'completed' && response.data) {
        return {
          success: true,
          data: response.data || null,
        }
      } else {
        return {
          success: false,
          error: 'Scraping failed',
          error_type: 'ScrapingFailed',
          timestamp: new Date().toISOString(),
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString(),
      };
    }
  },
});
