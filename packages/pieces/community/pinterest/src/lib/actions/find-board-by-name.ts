import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown } from '../common/props';
import { findBoardByNameActionOutputSchema } from '../output-schemas';

export const findBoardByName = createAction({
  auth: pinterestAuth,
  name: 'findBoardByName',
  classification: 'SEARCH',
  outputSchema: findBoardByNameActionOutputSchema,
  displayName: 'Find Board by Name',
  description: "Search for boards by name using Pinterest's search API.",
  audience: 'both',
  aiMetadata: {
    description:
      "Searches the authenticated account's boards by a text query and returns matching boards. Use to resolve a board name into a board_id before creating Pins or updating a board. Read-only and idempotent; supports pagination via a bookmark token.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description: 'Words in the board name.',
      placeholder: 'e.g. recipes',
    }),
    ad_account_id: adAccountIdDropdown,
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description: 'Bookmark from a previous run to fetch the next page.',
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, ad_account_id, bookmark } = propsValue;

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
