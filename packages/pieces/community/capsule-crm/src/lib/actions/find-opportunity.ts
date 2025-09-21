import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS } from '../common';

export const findOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_opportunity',
  displayName: 'Find Opportunity',
  description: 'Searches for opportunities in Capsule CRM.',
  props: {
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to find opportunities by name or description',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { searchQuery, limit } = context.propsValue;

    const queryParams = new URLSearchParams({
      q: searchQuery,
      perPage: (limit || 10).toString(),
    });

    const response = await makeApiCall(
      context.auth,
      `${API_ENDPOINTS.SEARCH_OPPORTUNITIES}?${queryParams.toString()}`,
      'GET'
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to search opportunities: ${response.status} ${response.body?.message || ''}`);
    }
  },
});