import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

const WEBSITE_CONTENT_CRAWLER_ACTOR_ID = 'aYG0l9s7dbB7j3gbS';

export const scrapeSingleUrl = createAction({
  name: 'scrapeSingleUrl',
  auth: apifyAuth,
  displayName: 'Scrape Single URL',
  description: 'Scrape a single URL using the Apify Website Content Crawler Actor and get its content as markdown and HTML.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'URL to be scraped. Must start with http:// or https:// and be a valid URL.',
      defaultValue: 'https://docs.apify.com/academy/web-scraping-for-beginners',
      required: true
    }),
    crawlerType: Property.StaticDropdown({
      required: true,
      displayName: 'Crawler Type',
      description: 'The type of crawler to use.',
      defaultValue: 'cheerio',
      options: {
        options: [
          {
            label: 'Cheerio',
            value: 'cheerio',
          },
          {
            label: 'JSDOM',
            value: 'jsdom',
          },
          {
            label: 'Playwright Adaptive',
            value: 'playwright:adaptive',
          },
          {
            label: 'Playwright Firefox',
            value: 'playwright:firefox',
          },
        ]
      }
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { crawlerType, url } = context.propsValue;
    const client = createApifyClient(apifyToken);

    try {
      new URL(url);
    } catch (error) {
      throw new Error('Invalid URL format. Please provide a valid URL with http:// or https://');
    }

    const input = {
      startUrls: [{ url }],
      crawlerType,
      maxCrawlDepth: 0,
      maxCrawlPages: 1,
      maxResults: 1,
      proxyConfiguration: {
        useApifyProxy: true,
      },
      removeCookieWarnings: true,
      saveHtml: true,
      saveMarkdown: true,
    };

    try {
      const run = await client.actor(WEBSITE_CONTENT_CRAWLER_ACTOR_ID).call(input);

      // Fetch dataset items if available
      if (run.defaultDatasetId) {
        const result = await client.dataset(run.defaultDatasetId).listItems();
        const firstResultItem = result.items[0];

        return {
          url: firstResultItem['url'] ?? url,
          markdown: firstResultItem['markdown'] ?? '',
          html: firstResultItem['html'] ?? '',
        };
      }

      return run;

    } catch (error: any) {
      throw new Error('Failed to scrape URL: ' + error.message);
    }
  },
});
