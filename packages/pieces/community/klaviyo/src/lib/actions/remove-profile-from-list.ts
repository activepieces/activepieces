import { createAction } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { KlaviyoProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoRemoveProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Remove a profile from a specific list.',
  props: {
    list_id: KlaviyoProps.listId,
    profile_id: KlaviyoProps.profileId,
  },
  async run(context) {
    return await klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.DELETE,
      path: `/lists/${context.propsValue.list_id}/relationships/profiles`,
      body: {
        data: [
          {
            type: 'profile',
            id: context.propsValue.profile_id,
          },
        ],
      },
    });
  },
});
