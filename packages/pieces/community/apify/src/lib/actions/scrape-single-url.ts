import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

const WEBSITE_CONTENT_CRAWLER_ACTOR_ID = 'apify/website-content-crawler';

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

    let run;
    try {
      run = await client.actor(WEBSITE_CONTENT_CRAWLER_ACTOR_ID).call(input);
    } catch (error: any) {
      throw new Error('Failed to scrape URL: ' + error.message);
    }

    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Website Content Crawler run finished with status "${run.status}". Run ID: ${run.id}`);
    }

    if (!run.defaultDatasetId) {
      return run;
    }

    let result;
    try {
      result = await client.dataset(run.defaultDatasetId).listItems();
    } catch (error: any) {
      throw new Error('Failed to fetch scrape results: ' + error.message);
    }

    if (!result.items || result.items.length === 0) {
      throw new Error('Scraping returned no results. The page may have been blocked or returned no content.');
    }

    const firstResultItem = result.items[0];

    return {
      url: firstResultItem['url'] ?? url,
      markdown: firstResultItem['markdown'] ?? '',
      html: firstResultItem['html'] ?? '',
    };
  },
});
