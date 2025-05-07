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
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter campaigns by status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Completed', value: 'completed' },
          { label: 'Draft', value: 'draft' },
        ],
      },
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Filter campaigns created after this date',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Filter campaigns created before this date',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of campaigns to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of campaigns to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const {
      name,
      status,
      created_after,
      created_before,
      limit,
      offset,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const queryParams: Record<string, string | number | boolean> = {};

    if (name) {
      queryParams.name = name;
    }

    if (status) {
      queryParams.status = status;
    }

    if (created_after) {
      queryParams.created_after = created_after;
    }

    if (created_before) {
      queryParams.created_before = created_before;
    }

    if (limit) {
      queryParams.limit = Math.min(100, Math.max(1, limit));
    }

    if (offset !== undefined) {
      queryParams.offset = Math.max(0, offset);
    }

    return await makeRequest({
      endpoint: 'campaigns',
      method: HttpMethod.GET,
      apiKey: apiKey as string,
      queryParams,
    });
  },
});
