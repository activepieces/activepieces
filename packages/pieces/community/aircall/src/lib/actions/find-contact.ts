import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const findContactAction = createAction({
  auth: aircallAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Finds contact based on provided filter',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search term to find contacts (name, email, or phone number)',
      required: true,
    }),
  },
  async run(context) {
    // Validate inputs
    if (!context.propsValue.searchTerm || context.propsValue.searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    if (context.propsValue.searchTerm.length > 100) {
      throw new Error('Search term cannot exceed 100 characters');
    }

    const client = makeClient({
      apiToken: context.auth.apiToken,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    try {
      const response = await client.makeRequest({
        method: HttpMethod.GET,
        url: '/contacts/search',
        queryParams: {
          search: context.propsValue.searchTerm.trim(),
        },
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { status: number } }).response;
        if (response.status === 400) {
          throw new Error('Invalid search term. Please check your input.');
        }
        if (response.status === 404) {
          throw new Error('No contacts found matching the search criteria.');
        }
      }
      throw new Error(`Failed to search contacts: ${errorMessage}`);
    }
  },
}); 