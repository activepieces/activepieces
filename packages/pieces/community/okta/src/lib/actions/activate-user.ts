import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue, oktaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const oktaActivateUserAction = createAction({
  auth: oktaAuth,
  name: 'okta_activate_user',
  displayName: 'Activate User',
  description: 'Activate a previously deactivated or pending user in Okta',
  props: {
    userId: oktaCommon.userDropdown,
    sendEmail: Property.Checkbox({
      displayName: 'Send Email',
      description: 'Send activation email to user',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { userId, sendEmail } = propsValue;

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.POST,
      resourceUri: `/api/v1/users/${userId}/lifecycle/activate`,
      query: {
        sendEmail: sendEmail ? 'true' : 'false',
      },
    });

    return response.body;
  },
});

