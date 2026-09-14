import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listBoardsActionOutputSchema } from '../output-schemas';

export const listBoards = createAction({
  auth: pinterestAuth,
  name: 'listBoards',
  classification: 'READ',
  outputSchema: listBoardsActionOutputSchema,
  displayName: 'List Boards',
  description: 'List the boards owned by the connected Pinterest account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the boards the connected account owns or collaborates on, returning each board id alongside its name, privacy and pin count. Use this to resolve a board name into the board_id that every pin and section action needs; prefer Search Boards when the account has many boards and part of the name is known. Results page through an opaque bookmark cursor, so pass the returned bookmark back in for the next page; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      description:
        'Return only boards with this privacy setting. Omit to return all of them.',
      options: {
        options: [
          { label: 'All', value: 'ALL' },
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Protected', value: 'PROTECTED' },
          { label: 'Secret', value: 'SECRET' },
          { label: 'Public and Secret', value: 'PUBLIC_AND_SECRET' },
        ],
      },
    }),
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
    const { privacy, page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/boards', { privacy, page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
