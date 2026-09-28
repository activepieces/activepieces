import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listPinsOnBoardActionOutputSchema } from '../output-schemas';

export const listPinsOnBoard = createAction({
  auth: pinterestAuth,
  name: 'listPinsOnBoard',
  classification: 'READ',
  outputSchema: listPinsOnBoardActionOutputSchema,
  displayName: 'List Pins on Board',
  description: 'List the Pins saved on a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Pins saved on one board, returning each pin id with its title, description, link and media. Use it to audit or pick a Pin from a known board; use List Pins for every Pin on the account regardless of board, and List Pins on Board Section to narrow to a single section. Requires a numeric board id from List Boards and pages through an opaque bookmark cursor; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      required: true,
      description: 'Numeric board id, as returned by List Boards.',
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      description: 'Pins per page (1-250, Pinterest defaults to 25).',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    const { board_id, page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath(`/boards/${board_id}/pins`, { page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
