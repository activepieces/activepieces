import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const removeProfileFromListAction = createAction({
  auth: klaviyoAuth,
  name: 'remove-profile-from-list',
  displayName: 'Remove Profile from List',
  description: 'Remove a profile from a specific Klaviyo list',
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID to remove from the list',
      required: true,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to remove the profile from',
      required: true,
    }),
  },
  async run(context) {
    const { profile_id, list_id } = context.propsValue;

    const requestBody = {
      data: [
        {
          type: 'profile',
          id: profile_id,
        },
      ],
    };

    const response = await klaviyoApiRequest(
      context.auth,
      HttpMethod.DELETE,
      `/lists/${list_id}/relationships/profiles/`,
      requestBody
    );

    return response;
  },
});
