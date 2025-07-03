import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';

export const crawlResults = createAction({
  auth: firecrawlAuth,
  name: 'crawlResults',
  displayName: 'Crawl Results',
  description: 'Get the results of a crawl job.',
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
        'Authorization': `Bearer ${auth}`,
      },
    });

    return response.body;
  },
}); 