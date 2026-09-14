import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { updateBoardOperation } from '../common/operations';
import { updateBoardActionOutputSchema } from '../output-schemas';

export const updateBoardDetails = createAction({
  auth: pinterestAuth,
  name: 'updateBoardDetails',
  classification: 'WRITE',
  outputSchema: updateBoardActionOutputSchema,
  displayName: 'Update Board Details',
  description: 'Change the name, description or privacy of a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a board in place: its name, description or privacy setting. Anything left unset keeps its current value, so one field can be corrected without resending the rest, and at least one field must be supplied. Use Rename Board Section for a section rather than a board. Re-sending the same values converges on the same state, so it is idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      required: true,
      description: 'Numeric board id, as returned by List Boards.',
    }),
    name: Property.ShortText({
      displayName: 'Board Name',
      required: false,
      description: 'New name (max 180 characters). Leave empty to keep it.',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description:
        'New description (max 500 characters). Leave empty to keep it.',
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      description:
        'New privacy setting. Leave empty to keep it. A board cannot be switched to secret through this connection.',
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Protected', value: 'PROTECTED' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await updateBoardOperation({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
