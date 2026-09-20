import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listPinsOnBoardActionOutputSchema } from '../output-schemas';

export const listPinsOnBoardSection = createAction({
  auth: pinterestAuth,
  name: 'listPinsOnBoardSection',
  classification: 'READ',
  outputSchema: listPinsOnBoardActionOutputSchema,
  displayName: 'List Pins on Board Section',
  description: 'List the Pins saved in one section of a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Pins inside a single section of a board. Use it when Pins are grouped into sections and only one group is wanted; use List Pins on Board for the whole board, including Pins that sit in no section. Requires both the board id and the section id from List Board Sections and pages through an opaque bookmark cursor; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      required: true,
      description: 'Numeric board id, as returned by List Boards.',
    }),
    section_id: Property.ShortText({
      displayName: 'Section ID',
      required: true,
      description:
        'Numeric section id, as returned by List Board Sections for this board.',
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
    const { board_id, section_id, page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath(`/boards/${board_id}/sections/${section_id}/pins`, {
        page_size,
        bookmark,
      })
    );

    return paginatedResult(response);
  },
});
