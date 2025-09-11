import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getAdsByPage = createAction({
  auth: ForeplayAuth,
  name: 'getAdsByPage',
  displayName: 'Get Ads by Page',
  description: 'Retrieve all ads belonging to a given Facebook Page ID.',
  props: {
    pageId: Property.ShortText({
      displayName: 'Facebook Page ID',
      description: 'The unique identifier of the Facebook page',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of ads to retrieve (optional)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Ad Status',
      description: 'Filter ads by their status (optional)',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Deleted', value: 'deleted' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { pageId, limit, status } = propsValue;

    if (!pageId) {
      throw new Error('Facebook Page ID is required');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('pageId', pageId);

    if (limit) {
      queryParams.append('limit', limit.toString());
    }

    if (status && status !== 'all') {
      queryParams.append('status', status);
    }

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/brand/getAdsByPageId?${queryParams.toString()}`
    );

    return response;
  },
});
