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
      description: 'Leave empty to keep the current name.',
      placeholder: 'e.g. Summer Recipes',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'Leave empty to keep the current description.',
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Public',
            value: 'PUBLIC',
            description: 'Visible to all',
          },
          {
            label: 'Secret',
            value: 'SECRET',
            description: 'Only you',
          },
        ],
      },
      description: 'Leave empty to keep the current setting.',
    }),
  },
  async run({ auth, propsValue }) {
    return await pinterestOperations.updateBoard({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
