import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Remove a profile from a specific list',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list',
      required: true,
    }),
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the profile to remove',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, profile_id } = context.propsValue;

    const requestData = {
      data: [
        {
          type: 'profile',
          id: profile_id,
        },
      ],
    };

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.DELETE,
      `/lists/${list_id}/relationships/profiles`,
      requestData
    );

    return {
      success: true,
      list_id,
      profile_id,
      response: response.body,
    };
  },
});
