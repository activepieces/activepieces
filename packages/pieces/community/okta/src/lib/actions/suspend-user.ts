import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest, userIdDropdown } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const suspendUserAction = createAction({
  auth: oktaAuth,
  name: 'suspend_user',
  displayName: 'Suspend User',
  description: 'Temporarily suspend a user in Okta',
  audience: 'both',
  aiMetadata: { description: 'Transitions an existing Okta user (by user ID) to the SUSPENDED lifecycle state, temporarily blocking sign-in without deactivating the account. Use for a reversible hold; reverse it with the unsuspend/activate flow. Idempotent on end-state — re-running leaves the user suspended.', idempotent: true },
  props: {
    userId: userIdDropdown(),
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