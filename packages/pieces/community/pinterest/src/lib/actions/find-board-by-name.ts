import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown } from '../common/props';

export const findBoardByName = createAction({
  auth: pinterestAuth,
  name: 'findBoardByName',
  displayName: 'Find Board by Name',
  description: "Search for boards by name using Pinterest's search API.",
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description: 'The search term to find boards (required).',
    }),
    ad_account_id: adAccountIdDropdown,
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description: 'Pagination bookmark from previous response.',
    }),
  },
  async run({ auth, propsValue }) {
    const { query, ad_account_id, bookmark } = propsValue;

    // Build query parameters
    const searchParams = new URLSearchParams();
    searchParams.append('query', query);

    if (ad_account_id) {
      searchParams.append('ad_account_id', ad_account_id);
    }

    if (bookmark) {
      searchParams.append('bookmark', bookmark);
    }

    const path = `/search/boards/?${searchParams.toString()}`;

    try {
      const response = await makeRequest(
        getAccessTokenOrThrow(auth),
        HttpMethod.GET,
        path
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to search boards: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },
});
