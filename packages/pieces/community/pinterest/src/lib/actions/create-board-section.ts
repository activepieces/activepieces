import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { boardSectionActionOutputSchema } from '../output-schemas';

export const createBoardSection = createAction({
  auth: pinterestAuth,
  name: 'createBoardSection',
  classification: 'WRITE',
  outputSchema: boardSectionActionOutputSchema,
  displayName: 'Create Board Section',
  description: 'Add a section to a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a named section inside an existing board and returns the new section id. Use it to group Pins within a board before creating Pins into that section. Check List Board Sections first: Pinterest allows two sections with the same name, so each call adds another section rather than reusing one, which makes this not idempotent.',
    idempotent: false,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      required: true,
      description: 'Numeric board id, as returned by List Boards.',
    }),
    name: Property.ShortText({
      displayName: 'Section Name',
      required: true,
      description: 'The name of the new section.',
    }),
  },
  async run({ auth, propsValue }) {
    const { board_id, name } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.POST,
      `/boards/${board_id}/sections`,
      { name }
    );
  },
});
