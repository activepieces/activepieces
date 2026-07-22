import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { downloadAndSaveScreenshot, FIRECRAWL_API_BASE_URL } from '../common/common';
import { scrapeUrlActionOutputSchema } from '../output-schemas';

export const scrapeUrl = createAction({
  auth: firecrawlAuth,
  name: 'scrape_url',
  displayName: 'Scrape URL',
  description: 'Fetch the content of a single web page in a chosen format.',
  audience: 'ai',
  outputSchema: scrapeUrlActionOutputSchema,
  aiMetadata: {
    description:
      'Fetches one web page and returns its content in the requested format (markdown, html, rawHtml, links, summary, or screenshot). Pick this when you already have the exact URL of a single page; use Crawl Website for a whole site, Batch Scrape for a known list of URLs, Map Website to only enumerate links, or Extract Data when you need typed/structured fields. Read-only against the target, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The exact web page URL to scrape (e.g. https://example.com/about). Obtain candidate URLs from Search Web or Map Website if you do not already have one.',
      required: true,
    }),
    format: Property.StaticDropdown<'markdown' | 'html' | 'rawHtml' | 'links' | 'summary' | 'screenshot'>({
      displayName: 'Output Format',
      description: 'Which representation of the page to return.',
      required: false,
      defaultValue: 'markdown',
      options: {
        disabled: false,
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
          { label: 'Raw HTML', value: 'rawHtml' },
          { label: 'Links', value: 'links' },
          { label: 'Summary', value: 'summary' },
          { label: 'Screenshot', value: 'screenshot' },
        ],
      },
    }),
    onlyMainContent: Property.Checkbox({
      displayName: 'Only Main Content',
      description: 'Return only the main content of the page, excluding headers, navs, footers, etc.',
      required: false,
      defaultValue: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      description: 'Maximum time to wait for the page to load, in milliseconds.',
      required: false,
      defaultValue: 60000,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const format = (propsValue.format as string) || 'markdown';

    const formatsArray: any[] = [];
    if (format === 'screenshot') {
      formatsArray.push({ type: 'screenshot', fullPage: true });
    } else {
      formatsArray.push(format);
    }

    const body: Record<string, any> = {
      url: propsValue.url,
      formats: formatsArray,
      timeout: propsValue.timeout,
    };
    if (propsValue.onlyMainContent !== undefined) {
      body['onlyMainContent'] = propsValue.onlyMainContent;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/scrape`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.secret_text}`,
        },
        body,
      });

      const result = response.body;
      if (format === 'screenshot' && result?.data?.screenshot) {
        await downloadAndSaveScreenshot(result.data, context);
      }
      return result;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): your API key plan does not permit this scrape or has insufficient credits.');
      }
      if (status === 404) {
        throw new Error('The page could not be scraped (404): the URL was not found.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
