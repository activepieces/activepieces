import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const deactivateUser = createAction({
  auth: oktaAuth,
  name: 'deactivate_user',
  displayName: 'Deactivate User',
  description: 'Deactivates a user. This is a destructive operation that deprovisions the user from all assigned apps.',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'An ID, login, or login shortname of an existing Okta user',
      required: true,
    }),
    sendEmail: Property.Checkbox({
      displayName: 'Send Deactivation Email',
      description: 'Sends a deactivation email to the admin if true',
      required: false,
      defaultValue: false,
    }),
    async: Property.Checkbox({
      displayName: 'Asynchronous Processing',
      description: 'Process the deactivation asynchronously',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { userId, sendEmail, async } = context.propsValue;

    const url = `https://${domain}/api/v1/users/${userId}/lifecycle/deactivate?sendEmail=${sendEmail}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `SSWS ${apiToken}`,
    };

    if (async) {
      headers['Prefer'] = 'respond-async';
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers,
    });

    return response.body;
  },
});
