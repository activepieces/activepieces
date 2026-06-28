import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';

export const getCrawlErrors = createAction({
  auth: firecrawlAuth,
  name: 'get_crawl_errors',
  displayName: 'Get Crawl Errors',
  description: 'List the URLs that failed or were blocked in a crawl job.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the URLs that failed or were blocked (e.g. by robots.txt) within a crawl job, for retry triage. Pick this after Get Crawl Results shows the crawl missed pages; it complements the results poller rather than replacing it. Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    crawlId: Property.ShortText({
      displayName: 'Crawl ID',
      description: 'The ID of the crawl job whose errors to list. Obtain it from the Crawl Website action result or List Active Crawls.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${FIRECRAWL_API_BASE_URL}/crawl/${propsValue.crawlId}/errors`,
        headers: {
          'Authorization': `Bearer ${auth.secret_text}`,
        },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): this crawl job is not accessible with your API key.');
      }
      if (status === 404) {
        throw new Error('Crawl job not found (404): the crawl ID does not exist or has expired. Use List Active Crawls to find a valid ID.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
