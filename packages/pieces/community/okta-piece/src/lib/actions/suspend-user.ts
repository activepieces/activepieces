import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const suspendUser = createAction({
  auth: oktaAuth,
  name: 'suspend_user',
  displayName: 'Suspend User',
  description: 'Suspends a user with ACTIVE status. Suspended users cannot sign in but retain their group and app assignments.',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'An ID, login, or login shortname of an existing Okta user',
      required: true,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { userId } = context.propsValue;

    const url = `https://${domain}/api/v1/users/${userId}/lifecycle/suspend`;

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
