import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';

export const crawlResults = createAction({
  auth: firecrawlAuth,
  name: 'crawlResults',
  displayName: 'Crawl Results',
  description: 'Get the results of a crawl job.',
  audience: 'both',
  aiMetadata: { description: 'Looks up the status and accumulated page results of a previously started crawl job by its crawl ID. Choose this to poll or fetch the output of a Crawl run that delivered an ID rather than waiting inline. Requires a valid crawl ID; it is a read-only lookup, so repeating the call is safe.', idempotent: true },
  props: {
    crawlId: Property.ShortText({
      displayName: 'Crawl ID',
      description: 'The ID of the crawl job to check.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.firecrawl.dev/v1/crawl/${propsValue.crawlId}`,
      headers: {
        'Authorization': `Bearer ${auth.secret_text}`,
      },
    });

    return response.body;
  },
}); 