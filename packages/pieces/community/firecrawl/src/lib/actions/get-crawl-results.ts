import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';

export const getCrawlResults = createAction({
  auth: firecrawlAuth,
  name: 'get_crawl_results',
  displayName: 'Get Crawl Results',
  description: 'Get the status and accumulated page results of a crawl job by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the status and accumulated page results of a previously started crawl job by its crawl ID. Pick this to poll or fetch the output of a crawl that returned an ID instead of waiting inline; use List Active Crawls to discover a crawl ID you do not have, Get Crawl Errors to see which URLs failed, or Cancel Crawl to stop one. Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    crawlId: Property.ShortText({
      displayName: 'Crawl ID',
      description: 'The ID of the crawl job to check. Obtain it from the Crawl Website action result or from List Active Crawls.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      // NOTE: inherits the pre-existing hardcoded v1 path from the original crawlResults action
      // (every other firecrawl action uses the v2 base). Aligned to v2 when the piece is next touched.
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.firecrawl.dev/v1/crawl/${propsValue.crawlId}`,
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
