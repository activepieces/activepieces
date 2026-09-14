import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinterestOperations } from '../common/operations';
import { adAccountIdDropdown, boardIdDropdown } from '../common/props';
import { updateBoardActionOutputSchema } from '../output-schemas';

export const updateBoard = createAction({
  auth: pinterestAuth,
  name: 'updateBoard',
  classification: 'WRITE',
  outputSchema: updateBoardActionOutputSchema,
  displayName: 'Update Board',
  description: "Update a board's name, description, or privacy settings.",
  audience: 'human',
  aiMetadata: {
    description:
      "Updates an existing board's name, description, and/or privacy setting, identified by board_id. Use to rename or reconfigure a board the user owns; at least one field must be supplied. Mutates the board on each call, so it is not idempotent.",
    idempotent: false,
  },
  props: {
    board_id: boardIdDropdown,
    ad_account_id: adAccountIdDropdown,
    name: Property.ShortText({
      displayName: 'Board Name',
      required: false,
      description:
        'The new name of the board (max 180 characters). Leave empty to keep current name.',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description:
        'The new description of the board (max 500 characters). Leave empty to keep current description.',
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Protected', value: 'PROTECTED' },
          { label: 'Secret', value: 'SECRET' },
        ],
      },
      description:
        'Update board privacy setting. Leave empty to keep current setting.',
    }),
  },
  async run({ auth, propsValue }) {
    return await pinterestOperations.updateBoard({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
