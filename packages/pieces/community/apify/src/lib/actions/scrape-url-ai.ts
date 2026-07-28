import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { scrapeUrlActionOutputSchema } from '../output-schemas';

const WEBSITE_CONTENT_CRAWLER_ACTOR_ID = 'apify/website-content-crawler';

export const apifyScrapeUrl = createAction({
  name: 'apify_scrape_url',
  auth: apifyAuth,
  displayName: 'Scrape URL',
  description: 'Scrapes a single web page via the Apify Website Content Crawler and returns its markdown and HTML.',
  audience: 'ai',
  outputSchema: scrapeUrlActionOutputSchema,
  aiMetadata: {
    description:
      'Scrape the content of one web page using the Apify Website Content Crawler Actor and return its text as markdown and HTML. Use this for a quick single-page extraction without configuring a full Actor run; for multi-page crawls or other actors use Run Actor instead. The URL must be a valid http/https address; crawlerType selects the rendering engine (cheerio for static HTML, playwright variants for JS-heavy pages). Not idempotent — each call launches a new crawler run.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'The page URL to scrape. Must start with http:// or https://.',
      required: true,
    }),
    crawlerType: Property.StaticDropdown({
      displayName: 'Crawler Type',
      description: 'The rendering engine to use.',
      required: true,
      defaultValue: 'cheerio',
      options: {
        options: [
          { label: 'Cheerio', value: 'cheerio' },
          { label: 'Playwright Adaptive', value: 'playwright:adaptive' },
          { label: 'Playwright Firefox', value: 'playwright:firefox' },
        ],
      },
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { crawlerType, url } = context.propsValue;
    const client = createApifyClient(apifyToken);

    try {
      new URL(url);
    } catch (error) {
      throw new Error(
        'Invalid URL format. Please provide a valid URL with http:// or https://'
      );
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
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error('Failed to scrape URL: ' + (error.message || error));
    }

    if (run.status !== 'SUCCEEDED') {
      throw new Error(
        `Website Content Crawler run finished with status "${run.status}". Run ID: ${run.id}`
      );
    }

    if (!run.defaultDatasetId) {
      return run;
    }

    let result;
    try {
      result = await client.dataset(run.defaultDatasetId).listItems();
    } catch (error: any) {
      throw new Error('Failed to fetch scrape results: ' + (error.message || error));
    }

    if (!result.items || result.items.length === 0) {
      throw new Error(
        'Scraping returned no results. The page may have been blocked or returned no content.'
      );
    }

    const firstResultItem = result.items[0];

    return {
      url: firstResultItem['url'] ?? url,
      markdown: firstResultItem['markdown'] ?? '',
      html: firstResultItem['html'] ?? '',
    };
  },
});
