import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Removes a profile from a Klaviyo list.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the Klaviyo list.',
      required: true,
    }),
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the Klaviyo profile to remove from the list.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, profile_id } = context.propsValue;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.DELETE,
      apiKey: context.auth,
      path: `/lists/${list_id}/relationships/profiles`,
      body: {
        data: [
          {
            type: 'profile',
            id: profile_id,
          },
        ],
      },
    });
    return result;
  },
});
