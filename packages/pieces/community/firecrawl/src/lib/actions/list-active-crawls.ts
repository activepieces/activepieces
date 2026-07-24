import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { listActiveCrawlsActionOutputSchema } from '../output-schemas';

export const listActiveCrawls = createAction({
  auth: firecrawlAuth,
  name: 'list_active_crawls',
  displayName: 'List Active Crawls',
  description: 'List the account\'s in-flight crawl jobs.',
  audience: 'ai',
  outputSchema: listActiveCrawlsActionOutputSchema,
  aiMetadata: {
    description:
      'Lists the in-flight crawl jobs for the account, with their IDs and status. Pick this to discover a crawl ID you did not store so you can then poll it with Get Crawl Results, inspect Get Crawl Errors, or stop it with Cancel Crawl. Takes no input. Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${FIRECRAWL_API_BASE_URL}/crawl/active`,
        headers: {
          'Authorization': `Bearer ${auth.secret_text}`,
        },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): your API key cannot list crawl jobs.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
