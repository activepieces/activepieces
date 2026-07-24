import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { cancelBatchScrapeActionOutputSchema } from '../output-schemas';

export const cancelBatchScrape = createAction({
  auth: firecrawlAuth,
  name: 'cancel_batch_scrape',
  displayName: 'Cancel Batch Scrape',
  description: 'Cancel an in-flight batch scrape job by its ID.',
  audience: 'ai',
  outputSchema: cancelBatchScrapeActionOutputSchema,
  aiMetadata: {
    description:
      'Cancels an in-flight batch scrape job by its ID, stopping further URL fetches. Pick this to abort a running Batch Scrape; use Get Batch Scrape Results to inspect what completed before cancelling. Cancelling an already-finished or unknown job errors, so this is not safe to repeat.',
    idempotent: false,
  },
  props: {
    jobId: Property.ShortText({
      displayName: 'Batch Scrape Job ID',
      description: 'The ID of the batch scrape job to cancel. Obtain it from the Batch Scrape action result.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${FIRECRAWL_API_BASE_URL}/batch/scrape/${propsValue.jobId}`,
        headers: {
          'Authorization': `Bearer ${auth.secret_text}`,
        },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): this batch job is not accessible with your API key.');
      }
      if (status === 404) {
        throw new Error('Batch scrape job not found (404): the job ID does not exist, has already finished, or was already cancelled.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
