import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { deleteBoardSectionActionOutputSchema } from '../output-schemas';

export const deleteBoardSection = createAction({
  auth: pinterestAuth,
  name: 'deleteBoardSection',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteBoardSectionActionOutputSchema,
  displayName: 'Delete Board Section',
  description: 'Delete a section from a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a section from a board. The Pins that were in the section stay on the board and become unsectioned, so this removes the grouping rather than the content; use Delete Board to remove the Pins as well. Requires both the board id and the section id, and deleting an already-deleted section errors rather than succeeding, so it is not idempotent.',
    idempotent: false,
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
  },
  async run({ auth, propsValue }) {
    const { board_id, section_id } = propsValue;

    await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.DELETE,
      `/boards/${board_id}/sections/${section_id}`
    );

    return {
      success: true,
      board_id,
      section_id,
      message: `Section ${section_id} was deleted from board ${board_id}.`,
    };
  },
});
