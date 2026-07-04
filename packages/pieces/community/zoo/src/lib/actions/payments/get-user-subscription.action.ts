import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserSubscriptionAction = createAction({
  name: 'get_user_subscription',
  displayName: 'Get User Subscription',
  description: 'Retrieve the current subscription for your user account',
  audience: 'both',
  aiMetadata: { description: 'Read the current subscription tied to the authenticated user account (plan, status, billing period). Use this for the individual user; for the organization-level subscription use Get Organization Subscription instead. Read-only and safe to repeat.', idempotent: true },
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment/subscriptions',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
