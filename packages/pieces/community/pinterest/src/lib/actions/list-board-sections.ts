import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listBoardSectionsActionOutputSchema } from '../output-schemas';

export const listBoardSections = createAction({
  auth: pinterestAuth,
  name: 'listBoardSections',
  classification: 'READ',
  outputSchema: listBoardSectionsActionOutputSchema,
  displayName: 'List Board Sections',
  description: 'List the sections of a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the sections of one board, returning each section id and name. Use it to resolve a section name into the board_section_id that Create Pin and List Pins on Board Section take. A section id is only meaningful together with its board id, so always carry both; results page through an opaque bookmark cursor. Read-only and idempotent.',
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
      description: 'Sections per page (1-250, Pinterest defaults to 25).',
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
      buildPath(`/boards/${board_id}/sections`, { page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
