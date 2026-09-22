import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinterestOperations } from '../common/operations';
import { adAccountIdDropdown } from '../common/props';
import { findBoardByNameActionOutputSchema } from '../output-schemas';

export const findBoardByName = createAction({
  auth: pinterestAuth,
  name: 'findBoardByName',
  classification: 'SEARCH',
  outputSchema: findBoardByNameActionOutputSchema,
  displayName: 'Find Board by Name',
  description: "Search for boards by name using Pinterest's search API.",
  audience: 'human',
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
    return await pinterestOperations.searchBoards({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
