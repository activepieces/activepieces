import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listBoardsActionOutputSchema } from '../output-schemas';

export const listFollowedBoards = createAction({
  auth: pinterestAuth,
  name: 'listFollowedBoards',
  classification: 'READ',
  outputSchema: listBoardsActionOutputSchema,
  displayName: 'List Followed Boards',
  description: 'List the boards the connected account follows.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists boards owned by other accounts that the connected account follows. Use it to see which boards feed this account; use List Boards for the boards the account itself owns, which is what pin actions need. Pages through an opaque bookmark cursor. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      description: 'Boards per page (1-250, Pinterest defaults to 25).',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    const { page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/user_account/following/boards', { page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
