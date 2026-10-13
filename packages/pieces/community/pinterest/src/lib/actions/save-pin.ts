import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { getPinActionOutputSchema } from '../output-schemas';

export const savePin = createAction({
  auth: pinterestAuth,
  name: 'savePin',
  classification: 'WRITE',
  outputSchema: getPinActionOutputSchema,
  displayName: 'Save Pin',
  description: 'Save an existing Pin onto a board owned by the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Saves an existing Pin, including any public Pin created by someone else, onto a board the connected account owns. Use this to repin curated content; use Create Pin instead to publish new media the account owns. Requires the source pin id and the destination board id, and optionally a section on that board. Saving the same Pin again creates another copy, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    pin_id: Property.ShortText({
      displayName: 'Pin ID',
      required: true,
      description: 'Numeric id of the Pin to save.',
    }),
    board_id: Property.ShortText({
      displayName: 'Destination Board ID',
      required: true,
      description:
        'Numeric board id to save the Pin onto, as returned by List Boards.',
    }),
    board_section_id: Property.ShortText({
      displayName: 'Destination Section ID',
      required: false,
      description:
        'Optional section on that board, as returned by List Board Sections.',
    }),
  },
  async run({ auth, propsValue }) {
    const { pin_id, board_id, board_section_id } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.POST,
      `/pins/${pin_id}/save`,
      {
        board_id,
        ...(board_section_id === undefined ? {} : { board_section_id }),
      }
    );
  },
});
