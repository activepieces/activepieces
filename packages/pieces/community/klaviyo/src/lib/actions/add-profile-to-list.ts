import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'add_profile_to_list',
  displayName: 'Add Profile to List',
  description: 'Add a profile to a specific list',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list',
      required: true,
    }),
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the profile to add',
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
      HttpMethod.POST,
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
