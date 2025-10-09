import { createAction } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue, oktaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const oktaSuspendUserAction = createAction({
  auth: oktaAuth,
  name: 'okta_suspend_user',
  displayName: 'Suspend User',
  description: 'Temporarily suspend a user in Okta',
  props: {
    userId: oktaCommon.userDropdown,
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { userId } = propsValue;

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.POST,
      resourceUri: `/api/v1/users/${userId}/lifecycle/suspend`,
    });

    return response.body;
  },
});

