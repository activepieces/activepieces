import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const suspendUserAction = createAction({
  auth: oktaAuth,
  name: 'suspend_user',
  displayName: 'Suspend User',
  description: 'Temporarily suspend a user in Okta',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID or Email',
      description: 'The Okta user ID or email address',
      required: true,
    }),
  },
  async run(context) {
    const userId = context.propsValue.userId;

    const response = await makeOktaRequest(
      context.auth,
      `/users/${userId}/lifecycle/suspend`,
      HttpMethod.POST
    );

    return response.body;
  },
});