import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addProfileToListAction = createAction({
  auth: klaviyoAuth,
  name: 'add-profile-to-list',
  displayName: 'Add Profile to List',
  description: 'Add a profile to a specific Klaviyo list',
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID to add to the list',
      required: true,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to add the profile to',
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
      HttpMethod.POST,
      `/lists/${list_id}/relationships/profiles/`,
      requestBody
    );

    return response;
  },
});
