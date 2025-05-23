import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const searchCampaignsAction = createAction({
  auth: instantlyAiAuth,
  name: 'search_campaigns',
  displayName: 'Search Campaigns',
  description: 'Search for campaigns in Instantly using various filters',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'Filter campaigns by name (partial match)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of campaigns to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
    starting_after: Property.ShortText({
      displayName: 'Starting After',
      description: 'The ID of the last item in the previous page - used for pagination',
      required: false,
    }),
    tag_ids: Property.ShortText({
      displayName: 'Tag IDs',
      description: 'Filter campaigns by tag ids. Specify multiple tag ids by separating them with a comma',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      limit,
      starting_after,
      tag_ids,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const queryParams: Record<string, string | number | boolean> = {};

    if (name) {
      queryParams['search'] = name;
    }

    if (starting_after) {
      queryParams['starting_after'] = starting_after;
    }

    if (tag_ids) {
      queryParams['tag_ids'] = tag_ids;
    }

    // Ensure limit is within range and defaulted to 20
    const actualLimit = Math.min(100, Math.max(1, limit || 20));
    queryParams['limit'] = actualLimit;

    return await makeRequest({
      endpoint: 'campaigns',
      method: HttpMethod.GET,
      apiKey: apiKey as string,
      queryParams,
    });
  },
});
