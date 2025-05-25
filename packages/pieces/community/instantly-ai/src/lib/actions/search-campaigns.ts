import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const searchCampaignsAction = createAction({
  auth: instantlyAiAuth,
  name: 'search_campaigns',
  displayName: 'Search Campaigns',
  description: 'Searchs for campaigns using various filters.',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;
    const { auth: apiKey } = context;

    const result = [];

    let startingAfter: string | undefined = undefined;
    let hasMore = true;

    do {
      const qs: QueryParams = {
        limit: '100',
        search: name,
      };

      if (startingAfter) qs['starting_after'] = startingAfter;

      const response = (await makeRequest({
        endpoint: 'campaigns',
        method: HttpMethod.GET,
        apiKey,
        queryParams: qs,
      })) as { next_starting_after?: string; items: Record<string, any>[] };

      const items = response.items || [];
      result.push(...items);

      startingAfter = response.next_starting_after;
      hasMore = !!startingAfter && items.length > 0;
    } while (hasMore);

    return {
      found: result.length > 0,
      result,
    };
  },
});
