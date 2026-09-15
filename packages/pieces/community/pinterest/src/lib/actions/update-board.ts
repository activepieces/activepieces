import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown, boardIdDropdown } from '../common/props';
import { updateBoardActionOutputSchema } from '../output-schemas';

export const updateBoard = createAction({
  auth: pinterestAuth,
  name: 'updateBoard',
  classification: 'WRITE',
  outputSchema: updateBoardActionOutputSchema,
  displayName: 'Update Board',
  description: "Update a board's name, description, or privacy settings.",
  audience: 'both',
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
    const { board_id, name, description, privacy, ad_account_id } = propsValue;

    const trimmedName = name?.trim();
    const trimmedDescription = description?.trim();

    if (!trimmedName && !trimmedDescription && !privacy) {
      throw new Error(
        'At least one field (name, description, or privacy) must be provided to update the board.'
      );
    }

    if (name && name.length > 180) {
      throw new Error('Board name must be 180 characters or less');
    }

    if (description && description.length > 500) {
      throw new Error('Board description must be 500 characters or less');
    }

    const body: any = {};
    if (trimmedName) {
      body.name = trimmedName;
    }
    if (trimmedDescription) {
      body.description = trimmedDescription;
    }
    if (privacy) {
      body.privacy = privacy;
    }

    let path = `/boards/${board_id}`;
    if (ad_account_id) {
      path = `/boards/${board_id}?ad_account_id=${encodeURIComponent(
        ad_account_id
      )}`;
    }

    try {
      return await makeRequest(
        getAccessTokenOrThrow(auth),
        HttpMethod.PATCH,
        path,
        body
      );
    } catch (error) {
      throw new Error(
        `Failed to update board: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },
});
