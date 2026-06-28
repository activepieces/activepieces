import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';

export const batchScrape = createAction({
  auth: firecrawlAuth,
  name: 'batch_scrape',
  displayName: 'Batch Scrape',
  description: 'Start a batch job that scrapes a list of known URLs and returns a job ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts an asynchronous job that scrapes a fixed list of known URLs in the same format, and returns the job ID. Pick this when you already have several URLs to fetch at once; use Scrape URL for a single page or Crawl Website to discover-and-fetch a site. This action only STARTS the job (it does not wait, avoiding the action time limit) — then poll Get Batch Scrape Results with the returned ID, inspect Get Batch Scrape Errors, or stop it with Cancel Batch Scrape. Read-only against the targets, so re-running is safe.',
    idempotent: true,
  },
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'The list of page URLs to scrape (at least one). Obtain them from Search Web or Map Website if needed.',
      required: true,
    }),
    format: Property.StaticDropdown<'markdown' | 'html' | 'rawHtml' | 'links' | 'summary'>({
      displayName: 'Output Format',
      description: 'Which representation of each page to return.',
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
        ],
      },
    }),
    onlyMainContent: Property.Checkbox({
      displayName: 'Only Main Content',
      description: 'Return only the main content of each page, excluding headers, navs, footers, etc.',
      required: false,
      defaultValue: true,
    }),
    maxConcurrency: Property.Number({
      displayName: 'Max Concurrency',
      description: 'Maximum number of URLs scraped in parallel.',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Per-Page Timeout (ms)',
      description: 'Maximum time to wait for each page to load, in milliseconds.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const urlsArray = (propsValue.urls as unknown[]).map((u) => String(u));
    const format = (propsValue.format as string) || 'markdown';

    const body: Record<string, any> = {
      urls: urlsArray,
      formats: [format],
    };
    if (propsValue.onlyMainContent !== undefined) {
      body['onlyMainContent'] = propsValue.onlyMainContent;
    }
    if (propsValue.maxConcurrency !== undefined) {
      body['maxConcurrency'] = propsValue.maxConcurrency;
    }
    if (propsValue.timeout !== undefined) {
      body['timeout'] = propsValue.timeout;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/batch/scrape`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.secret_text}`,
        },
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): your API key plan does not permit batch scraping or has insufficient credits.');
      }
      if (status === 404) {
        throw new Error('Batch scrape endpoint not found (404).');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
