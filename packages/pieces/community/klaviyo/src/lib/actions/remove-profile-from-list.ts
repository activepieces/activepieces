import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall, klaviyoCommon } from '../../common';

export const removeProfileFromList = createAction({
  name: 'remove_profile_from_list',
  auth: klaviyoAuth,
  displayName: 'Remove Profile from List',
  description: 'Remove one or more profiles from a specific list.',
  props: {
    list: klaviyoCommon.lists,
    profileIds: Property.Array({
      displayName: 'Profile IDs',
      description: 'One or more Klaviyo profile IDs to remove from the list.',
      required: true,
    }),
  },
  async run(context) {
    const { list, profileIds } = context.propsValue;

    const response = await klaviyoApiCall(
      HttpMethod.DELETE,
      `lists/${list}/relationships/profiles`,
      context.auth.secret_text,
      {
        data: (profileIds as string[]).map((id) => ({
          type: 'profile',
          id,
        })),
      }
    );
    return response.body ?? { success: true };
  },
});
