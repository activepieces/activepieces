import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const activateUser = createAction({
  auth: oktaAuth,
  name: 'activate_user',
  displayName: 'Activate User',
  description: 'Activates a user with STAGED or DEPROVISIONED status',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'An ID, login, or login shortname of an existing Okta user',
      required: true,
    }),
    sendEmail: Property.Checkbox({
      displayName: 'Send Activation Email',
      description: 'Sends an activation email to the user if true',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { userId, sendEmail } = context.propsValue;

    const url = `https://${domain}/api/v1/users/${userId}/lifecycle/activate?sendEmail=${sendEmail}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${apiToken}`,
      },
    });

    return response.body;
  },
});
