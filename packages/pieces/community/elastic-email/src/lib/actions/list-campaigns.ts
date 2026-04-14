import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';
import { DEFAULT_LIMIT } from '../common/constants';

export const listCampaignsAction = createAction({
  name: 'list_campaigns',
  displayName: 'List Campaigns',
  description: 'Fetch a paginated list of campaigns from Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter campaigns by name.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of campaigns to return (max 100).',
      required: false,
      defaultValue: DEFAULT_LIMIT,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of campaigns to skip.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.search) {
      queryParams['search'] = propsValue.search;
    }
    if (propsValue.limit !== undefined) {
      queryParams['limit'] = String(propsValue.limit);
    }
    if (propsValue.offset !== undefined) {
      queryParams['offset'] = String(propsValue.offset);
    }
    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/campaigns',
      queryParams,
    });
  },
});
