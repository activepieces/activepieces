import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { getBatchScrapeResultsActionOutputSchema } from '../output-schemas';

export const getBatchScrapeResults = createAction({
  auth: firecrawlAuth,
  name: 'get_batch_scrape_results',
  displayName: 'Get Batch Scrape Results',
  description: 'Get the status and accumulated page results of a batch scrape job by its ID.',
  audience: 'ai',
  outputSchema: getBatchScrapeResultsActionOutputSchema,
  aiMetadata: {
    description:
      'Looks up the status and accumulated page results of a batch scrape job by its ID. Pick this to poll the job started by Batch Scrape until it completes; use Get Batch Scrape Errors to see which URLs failed, or Cancel Batch Scrape to stop it. Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    jobId: Property.ShortText({
      displayName: 'Batch Scrape Job ID',
      description: 'The ID of the batch scrape job to check. Obtain it from the Batch Scrape action result.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
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
        throw new Error('Batch scrape job not found (404): the job ID does not exist or has expired.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
