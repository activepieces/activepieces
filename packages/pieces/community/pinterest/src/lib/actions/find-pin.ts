import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown } from '../common/props';

export const findPin = createAction({
  auth: pinterestAuth,
  name: 'findPin',
  displayName: 'Find Pin by Title/Keyword',
  description: 'Search for Pins using title, description, or keywords.',
  props: {
    ad_account_id: adAccountIdDropdown,
    query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description:
        'Search terms for pin titles, descriptions, or tags. You can also search using comma-separated pin IDs.',
    }),
    bookmark: Property.ShortText({
      displayName: 'Pagination Bookmark',
      required: false,
      description:
        'Bookmark token from previous search results for pagination.',
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      required: false,
      description:
        'Maximum number of pins to return (useful for large result sets).',
      defaultValue: 25,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, bookmark, ad_account_id, max_results } = propsValue;

    // Build query parameters
    const params = new URLSearchParams();
    params.append('query', query);

    if (bookmark) {
      params.append('bookmark', bookmark);
    }

    if (ad_account_id) {
      params.append('ad_account_id', ad_account_id);
    }

    const path = `/search/pins?${params.toString()}`;

    try {
      const response = await makeRequest(
        getAccessTokenOrThrow(auth),
        HttpMethod.GET,
        path
      );

      // Apply max_results limit if specified
      let items = response.items || [];
      if (max_results && items.length > max_results) {
        items = items.slice(0, max_results);
      }

      return {
        items,
        bookmark: response.bookmark,
        total_results: items.length,
        query_used: query,
        has_more: !!response.bookmark,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('No pins found matching your search criteria.');
      }
      throw new Error(
        `Failed to search pins: ${error.message || 'Unknown error'}`
      );
    }
  },
});
