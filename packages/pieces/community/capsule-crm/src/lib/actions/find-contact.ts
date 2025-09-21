import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS } from '../common';

export const findContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Searches for contacts (people or organizations) in Capsule CRM.',
  props: {
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to find contacts by name, email, or other fields',
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
      `${API_ENDPOINTS.SEARCH_PARTIES}?${queryParams.toString()}`,
      'GET'
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to search contacts: ${response.status} ${response.body?.message || ''}`);
    }
  },
});