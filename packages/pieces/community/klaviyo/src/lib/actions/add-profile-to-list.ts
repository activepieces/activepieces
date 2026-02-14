import { createAction } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { KlaviyoProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoAddProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_add_profile_to_list',
  displayName: 'Add Profile to List',
  description: 'Add a profile to a specific list.',
  props: {
    list_id: KlaviyoProps.listId,
    profile_id: KlaviyoProps.profileId,
  },
  async run(context) {
    return await klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
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
