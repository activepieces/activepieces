import { createAction } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserSubscriptionAction = createAction({
  name: 'get_user_subscription',
  displayName: 'Get User Subscription',
  description: 'Retrieve the current subscription for your user account',
  auth: textToCadAuth,
  category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment/subscriptions',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
