import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const getProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'get_profile',
  displayName: 'Get Profile',
  description: 'Retrieve a single profile by profile ID.',
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID',
      required: true,
    }),
  },
  async run(context) {
    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: `/profiles/${context.propsValue.profile_id}`,
    });
  },
});
