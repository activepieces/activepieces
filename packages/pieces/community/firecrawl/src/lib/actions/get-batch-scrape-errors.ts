import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { getBatchScrapeErrorsActionOutputSchema } from '../output-schemas';

export const getBatchScrapeErrors = createAction({
  auth: firecrawlAuth,
  name: 'get_batch_scrape_errors',
  displayName: 'Get Batch Scrape Errors',
  description: 'List the URLs that failed in a batch scrape job.',
  audience: 'ai',
  outputSchema: getBatchScrapeErrorsActionOutputSchema,
  aiMetadata: {
    description:
      'Lists the URLs that failed (and why) within a batch scrape job, so you can decide which ones to re-scrape. Pick this for retry triage after Get Batch Scrape Results shows failures; it complements, not replaces, the results poller. Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    jobId: Property.ShortText({
      displayName: 'Batch Scrape Job ID',
      description: 'The ID of the batch scrape job whose errors to list. Obtain it from the Batch Scrape action result.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${FIRECRAWL_API_BASE_URL}/batch/scrape/${propsValue.jobId}/errors`,
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
