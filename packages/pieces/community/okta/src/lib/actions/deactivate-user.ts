import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue, oktaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const oktaDeactivateUserAction = createAction({
  auth: oktaAuth,
  name: 'okta_deactivate_user',
  displayName: 'Deactivate User',
  description: 'Deactivate (disable) a user in Okta',
  props: {
    userId: oktaCommon.userDropdown,
    sendEmail: Property.Checkbox({
      displayName: 'Send Email',
      description: 'Send deactivation notification email',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { userId, sendEmail } = propsValue;

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.POST,
      resourceUri: `/api/v1/users/${userId}/lifecycle/deactivate`,
      query: {
        sendEmail: sendEmail ? 'true' : 'false',
      },
    });

    return response.body;
  },
});

