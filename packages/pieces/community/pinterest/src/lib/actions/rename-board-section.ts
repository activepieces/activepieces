import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { boardSectionActionOutputSchema } from '../output-schemas';

export const renameBoardSection = createAction({
  auth: pinterestAuth,
  name: 'renameBoardSection',
  classification: 'WRITE',
  outputSchema: boardSectionActionOutputSchema,
  displayName: 'Rename Board Section',
  description: 'Change the name of a board section.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames an existing board section. The name is the only field Pinterest allows to be changed on a section, so this is a rename rather than a general update, and it moves no Pins. Requires both the board id and the section id from List Board Sections; sending the same name again converges on the same state, so it is idempotent.',
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
    name: Property.ShortText({
      displayName: 'Section Name',
      required: true,
      description: 'The new name for the section.',
    }),
  },
  async run({ auth, propsValue }) {
    const { board_id, section_id, name } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.PATCH,
      `/boards/${board_id}/sections/${section_id}`,
      { name }
    );
  },
});
