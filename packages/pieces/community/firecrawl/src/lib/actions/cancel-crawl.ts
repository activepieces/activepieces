import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { cancelCrawlActionOutputSchema } from '../output-schemas';

export const cancelCrawl = createAction({
  auth: firecrawlAuth,
  name: 'cancel_crawl',
  displayName: 'Cancel Crawl',
  description: 'Cancel an in-flight crawl job by its ID.',
  audience: 'ai',
  outputSchema: cancelCrawlActionOutputSchema,
  aiMetadata: {
    description:
      'Cancels an in-flight crawl job by its ID, stopping further page discovery and fetching. Pick this to abort a running Crawl Website (this is also the delete verb — Firecrawl has one DELETE for cancel and delete); use Get Crawl Results to inspect what completed first, or List Active Crawls to find the ID. Cancelling an already-finished or unknown job errors, so this is not safe to repeat.',
    idempotent: false,
  },
  props: {
    crawlId: Property.ShortText({
      displayName: 'Crawl ID',
      description: 'The ID of the crawl job to cancel. Obtain it from the Crawl Website action result or List Active Crawls.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${FIRECRAWL_API_BASE_URL}/crawl/${propsValue.crawlId}`,
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
        throw new Error('Crawl job not found (404): the crawl ID does not exist, has already finished, or was already cancelled.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
