import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'add_profile_to_list',
  displayName: 'Add Profile to List',
  description: 'Adds an existing profile to a Klaviyo list.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the Klaviyo list.',
      required: true,
    }),
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the Klaviyo profile to add to the list.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, profile_id } = context.propsValue;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.POST,
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
