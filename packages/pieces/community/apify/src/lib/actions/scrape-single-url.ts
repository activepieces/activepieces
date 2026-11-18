import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient, getErrorMessage } from '../common';
import { scrapeUrlActionOutputSchema } from '../output-schemas';

const WEBSITE_CONTENT_CRAWLER_ACTOR_ID = 'apify/website-content-crawler';

export const scrapeSingleUrl = createAction({
  name: 'scrapeSingleUrl',
  classification: 'READ',
  auth: apifyAuth,
  displayName: 'Scrape Single URL',
  description: 'Gets one page\'s content as Markdown and HTML using Apify.',
  audience: 'human',
  outputSchema: scrapeUrlActionOutputSchema,
  aiMetadata: { description: 'Scrapes the content of one web page via the Apify Website Content Crawler Actor and returns its text as markdown and HTML. Use this for a quick single-page extraction without configuring a full Actor run; the URL must be a valid http/https address and crawler type (Cheerio or Playwright) selects the rendering engine. Not idempotent — each call launches a new crawler run.', idempotent: false },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Must start with http:// or https://.',
      placeholder: 'https://example.com/page',
      defaultValue: 'https://docs.apify.com/academy/web-scraping-for-beginners',
      required: true
    }),
    crawlerType: Property.StaticDropdown({
      required: true,
      displayName: 'Crawler Type',
      description: 'Raw HTTP is fastest but skips JavaScript. Adaptive and Firefox render it; Firefox is blocked least.',
      defaultValue: 'cheerio',
      display: 'cards',
      options: {
        options: [
          {
            label: 'Raw HTTP',
            value: 'cheerio',
            icon: 'code',
          },
          {
            label: 'Adaptive',
            value: 'playwright:adaptive',
            icon: 'sliders',
          },
          {
            label: 'Firefox',
            value: 'playwright:firefox',
            icon: 'file',
          },
        ]
      }
    }),
  },
  propertyGroups: [
    { key: 'page', display: 'section', label: 'Page to Scrape', icon: 'file', props: ['url'] },
    { key: 'engine', display: 'section', label: 'How to Load It', icon: 'code', props: ['crawlerType'] },
  ],
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { crawlerType, url } = context.propsValue;
    const client = createApifyClient(apifyToken);

    if (!isHttpUrl(url)) {
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
    } catch (error) {
      throw new Error('Failed to scrape URL: ' + getErrorMessage(error));
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
    } catch (error) {
      throw new Error('Failed to fetch scrape results: ' + getErrorMessage(error));
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

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
