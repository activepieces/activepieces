import { scrapelessApiAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { createScrapelessClient } from '../services/scrapeless-api-client';

export const crawlCrawlApi = createAction({
  auth: scrapelessApiAuth,
  name: 'crawl_crawl',
  displayName: 'Crawl Data from All Pages',
  description: 'Crawls a website and its linked pages to extract comprehensive data.',
  props: {
    url: Property.ShortText({
      displayName: 'URL to Crawl',
      description: 'The URL of the webpage to crawl.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number Of Subpages',
      required: true,
      defaultValue: 5,
    })

  },
  async run({ propsValue, auth }) {
    try {
      const client = createScrapelessClient(auth);

      const url = propsValue.url;
      const limit = propsValue.limit;
      const browserOptions = {
        "proxy_country": "ANY",
        "session_name": "Crawl",
        "session_recording": true,
        "session_ttl": 900,
      }

      const response = await client.scrapingCrawl.crawl.crawlUrl(url, {
        browserOptions,
        limit
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
