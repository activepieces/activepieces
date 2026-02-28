import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Remove a profile from a specific list in Klaviyo.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list.',
      required: true,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the profile to remove.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await klaviyoApiCall(
      auth as string,
      HttpMethod.DELETE,
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
