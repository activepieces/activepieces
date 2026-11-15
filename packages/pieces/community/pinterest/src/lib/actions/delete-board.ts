import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { deleteBoardActionOutputSchema } from '../output-schemas';

export const deleteBoard = createAction({
  auth: pinterestAuth,
  name: 'deleteBoard',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteBoardActionOutputSchema,
  displayName: 'Delete Board',
  description: 'Permanently delete a board and every Pin saved on it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a board together with every Pin saved on it. This cannot be undone and destroys content, so confirm the board id with Get Board first and delete individual Pins instead when only some content should go. Deleting an already-deleted board returns an error rather than succeeding, so it is not idempotent.',
    idempotent: false,
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

    await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.DELETE,
      `/boards/${board_id}`
    );

    return {
      success: true,
      board_id,
      message: `Board ${board_id} and all of its Pins were deleted.`,
    };
  },
});
