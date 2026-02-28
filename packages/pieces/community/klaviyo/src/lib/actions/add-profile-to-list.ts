import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'add_profile_to_list',
  displayName: 'Add Profile to List',
  description: 'Add a profile to a specific list in Klaviyo.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list.',
      required: true,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the profile to add.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await klaviyoApiCall(
      auth as string,
      HttpMethod.POST,
      `/lists/${propsValue.listId}/relationships/profiles`,
      {
        data: [
          {
            type: 'profile',
            id: propsValue.profileId,
          },
        ],
      },
    );
  },
});
