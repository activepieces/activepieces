import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const searchLeadsAction = createAction({
  auth: instantlyAiAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'Search for leads in Instantly by name or email',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search string to find leads - can be First Name, Last Name, or Email (e.g. "John Doe")',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of leads to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const {
      search,
      limit,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const requestBody: Record<string, string | number | boolean> = {
      search,
    };

    if (limit) {
      requestBody['limit'] = Math.min(100, Math.max(1, limit));
    }

    return await makeRequest({
      endpoint: 'leads/list',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: requestBody,
    });
  },
});
