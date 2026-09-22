import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { getBoardActionOutputSchema } from '../output-schemas';

export const getBoard = createAction({
  auth: pinterestAuth,
  name: 'getBoard',
  classification: 'READ',
  outputSchema: getBoardActionOutputSchema,
  displayName: 'Get Board',
  description: 'Read a single board by its id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one board by id and returns its name, description, privacy, owner and pin and follower counts. Use it to confirm a board exists and check its privacy before pinning to it; use List Boards or Search Boards when only the name is known. The board id is a numeric string taken from List Boards, Search Boards or a pin record; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      required: true,
      description: 'Numeric board id, as returned by List Boards.',
    }),
  },
  async run({ auth, propsValue }) {
    const { board_id } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      `/boards/${board_id}`
    );
  },
});
