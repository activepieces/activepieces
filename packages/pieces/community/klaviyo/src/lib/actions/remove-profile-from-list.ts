import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';
import { listIdDropdown } from '../common/props';

export const removeProfileFromListAction = createAction({
  auth: klaviyoAuth,
  name: 'remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Remove one or more profiles from a Klaviyo list.',
  props: {
    list_id: listIdDropdown,
    profile_ids: Property.Array({
      displayName: 'Profile IDs',
      description: 'One or more Klaviyo profile IDs to remove from the list',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, profile_ids } = context.propsValue;

    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.DELETE,
      endpoint: `/lists/${list_id}/relationships/profiles`,
      body: {
        data: (profile_ids as string[]).map((id) => ({
          type: 'profile',
          id,
        })),
      },
    });
  },
});
