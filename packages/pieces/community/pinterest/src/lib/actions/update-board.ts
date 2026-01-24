import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown, boardIdDropdown } from '../common/props';

export const updateBoard = createAction({
  auth: pinterestAuth,
  name: 'updateBoard',
  displayName: 'Update Board',
  description: "Update a board's name, description, or privacy settings.",
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
    const { board_id, name, description, privacy, ad_account_id } = propsValue;

    // Validation - at least one field must be provided for update
    if (!name && description === undefined && !privacy) {
      throw new Error(
        'At least one field (name, description, or privacy) must be provided to update the board.'
      );
    }

    // Validation for field lengths
    if (name && name.length > 180) {
      throw new Error('Board name must be 180 characters or less');
    }

    if (description && description.length > 500) {
      throw new Error('Board description must be 500 characters or less');
    }

    // Build request body with only the fields being updated
    const body: any = {};
    if (name && name.trim()) {
      body.name = name.trim();
    }
    if (description !== undefined) {
      body.description = description;
    }
    if (privacy) {
      body.privacy = privacy;
    }

    // Build path with query parameter if ad_account_id is provided
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
