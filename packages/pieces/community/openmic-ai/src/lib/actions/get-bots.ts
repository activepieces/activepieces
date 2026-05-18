import { createAction, Property } from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const getBots = createAction({
  auth: openmicAiAuth,
  name: 'getBots',
  displayName: 'Get Bots',
  description: 'Retrieve all bots with optional filtering and pagination',
  props: {
    name: Property.ShortText({
      displayName: 'Bot Name',
      description: 'Filter by bot name (partial match)',
      required: false,
    }),
    createdAfter: Property.ShortText({
      displayName: 'Created After',
      description: 'Filter bots created after this date (ISO 8601 format)',
      required: false,
    }),
    createdBefore: Property.ShortText({
      displayName: 'Created Before',
      description: 'Filter bots created before this date (ISO 8601 format)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of bots to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of bots to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();

    if (context.propsValue.limit) {
      params.append('limit', String(context.propsValue.limit));
    }

    if (context.propsValue.offset !== undefined) {
      params.append('offset', String(context.propsValue.offset));
    }

    if (context.propsValue.name) {
      params.append('name', context.propsValue.name);
    }

    if (context.propsValue.createdAfter) {
      params.append('created_after', context.propsValue.createdAfter);
    }

    if (context.propsValue.createdBefore) {
      params.append('created_before', context.propsValue.createdBefore);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/bots?${queryString}` : '/bots';

    const response = await makeRequest(context.auth, HttpMethod.GET, endpoint);

    return response;
  },
});
