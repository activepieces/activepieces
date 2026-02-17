import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall, klaviyoCommon } from '../../common';

export const addProfileToList = createAction({
  name: 'add_profile_to_list',
  auth: klaviyoAuth,
  displayName: 'Add Profile to List',
  description: 'Add one or more profiles to a specific list.',
  props: {
    list: klaviyoCommon.lists,
    profileIds: Property.Array({
      displayName: 'Profile IDs',
      description: 'One or more Klaviyo profile IDs to add to the list.',
      required: true,
    }),
  },
  async run(context) {
    const { list, profileIds } = context.propsValue;

    const response = await klaviyoApiCall(
      HttpMethod.POST,
      `lists/${list}/relationships/profiles`,
      context.auth.secret_text,
      {
        data: (profileIds as string[]).map((id) => ({
          type: 'profile',
          id,
        })),
      }
    );
    return response.body;
  },
});
