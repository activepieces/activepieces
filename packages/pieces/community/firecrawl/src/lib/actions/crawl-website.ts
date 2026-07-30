import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { polling, FIRECRAWL_API_BASE_URL } from '../common/common';
import { crawlWebsiteActionOutputSchema } from '../output-schemas';

export const crawlWebsite = createAction({
  auth: firecrawlAuth,
  name: 'crawl_website',
  displayName: 'Crawl Website',
  description: 'Crawl a website starting from a base URL and return the content of many pages.',
  audience: 'ai',
  outputSchema: crawlWebsiteActionOutputSchema,
  aiMetadata: {
    description:
      'Starts at a base URL, follows links across the site, and returns the content of many pages in one chosen format. Pick this to gather a whole site or section; use Scrape URL for a single page, Map Website to only list URLs without content, or Batch Scrape for a fixed list of known URLs. Runs as a job polled inline up to the timeout (long crawls may hit the action time limit); read-only against the site, so re-running is safe.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The base URL to start crawling from (e.g. https://example.com). Obtain it from Search Web or Map Website if needed.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Page Limit',
      description: 'Maximum number of pages to crawl.',
      required: false,
      defaultValue: 10,
    }),
    format: Property.StaticDropdown<'markdown' | 'html' | 'links' | 'summary'>({
      displayName: 'Output Format',
      description: 'Which representation of each page to return.',
      required: false,
      defaultValue: 'markdown',
      options: {
        disabled: false,
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
          { label: 'Links', value: 'links' },
          { label: 'Summary', value: 'summary' },
        ],
      },
    }),
    onlyMainContent: Property.Checkbox({
      displayName: 'Only Main Content',
      description: 'Return only the main content of each page, excluding headers, navs, footers, etc.',
      required: false,
      defaultValue: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description: 'Seconds to poll for completion before giving up. Keep well under the action time limit for large crawls; for big jobs prefer Crawl Website with a smaller limit or poll separately via Get Crawl Results.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const format = (propsValue.format as string) || 'markdown';

    const scrapeOptions: Record<string, any> = {
      formats: [format],
      maxAge: 172800000,
    };
    if (propsValue.onlyMainContent !== undefined) {
      scrapeOptions['onlyMainContent'] = propsValue.onlyMainContent;
    }

    const body: Record<string, any> = {
      url: propsValue.url,
      sitemap: 'include',
      crawlEntireDomain: false,
      maxDiscoveryDepth: 10,
      scrapeOptions,
    };
    if (propsValue.limit !== undefined) {
      body['limit'] = propsValue.limit;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/crawl`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.secret_text}`,
        },
        body,
      });

      const jobId = response.body.id;
      const timeoutSeconds = propsValue.timeout || 300;
      return await polling(jobId, auth.secret_text, timeoutSeconds, 'crawl');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): your API key plan does not permit crawling or has insufficient credits.');
      }
      if (status === 404) {
        throw new Error('The base URL could not be crawled (404): the URL was not found.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
