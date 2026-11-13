import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { CrawlStatusPage, FIRECRAWL_API_BASE_URL, followCrawlPages } from '../common/common';
import { getCrawlResultsActionOutputSchema } from '../output-schemas';

export const crawlResults = createAction({
  auth: firecrawlAuth,
  name: 'crawlResults',
  classification: 'READ',
  displayName: 'Crawl Results',
  description: 'Get the status and pages of a crawl started earlier.',
  audience: 'human',
  outputSchema: getCrawlResultsActionOutputSchema,
  aiMetadata: { description: 'Looks up the status and accumulated page results of a previously started crawl job by its crawl ID. Choose this to poll or fetch the output of a Crawl run that delivered an ID rather than waiting inline. Requires a valid crawl ID; it is a read-only lookup, so repeating the call is safe.', idempotent: true },
  props: {
    crawlId: Property.ShortText({
      displayName: 'Crawl ID',
      description: 'The id in the webhook events of a Crawl step.',
      placeholder: '0f1b3e9c-4a6d-4c1e-9a7b-2d8f5e6c7a10',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<CrawlStatusPage>({
      method: HttpMethod.GET,
      url: `${FIRECRAWL_API_BASE_URL}/crawl/${propsValue.crawlId}`,
      headers: {
        'Authorization': `Bearer ${auth.secret_text}`,
      },
    });

    return followCrawlPages({ firstPage: response.body, auth: auth.secret_text });
  },
}); 