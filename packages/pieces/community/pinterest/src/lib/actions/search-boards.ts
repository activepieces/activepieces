import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { searchBoardsOperation } from '../common/operations';
import { findBoardByNameActionOutputSchema } from '../output-schemas';

export const searchBoards = createAction({
  auth: pinterestAuth,
  name: 'searchBoards',
  classification: 'SEARCH',
  outputSchema: findBoardByNameActionOutputSchema,
  displayName: 'Search Boards',
  description: "Search the account's boards by text.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches the connected account's own boards by a text query and returns the matches with their board ids. Use it to resolve a board name into the board_id that pin and section actions need; use List Boards when the account has few boards and the whole set is wanted. The query matches board names and descriptions, only searches boards this account can see, and pages through an opaque bookmark cursor. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description: 'Text to match against board names and descriptions.',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    return await searchBoardsOperation({
      accessToken: getAccessTokenOrThrow(auth),
      query: propsValue.query,
      bookmark: propsValue.bookmark,
    });
  },
});
