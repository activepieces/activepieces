import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createUserSubscriptionAction = createAction({
  name: 'create_user_subscription',
  displayName: 'Create User Subscription',
  description: 'Create a new subscription for your user account',
  audience: 'both',
  aiMetadata: { description: 'Start a new subscription on the authenticated user account for a given plan ID. Use for the individual user; this creates a billable subscription, so calling again may create duplicate subscriptions. Check Get User Subscription first to avoid re-subscribing.', idempotent: false },
  auth: zooAuth,
  // category: 'Payments',
  props: {
    planId: Property.ShortText({
      displayName: 'Plan ID',
      required: true,
      description: 'ID of the subscription plan',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/user/payment/subscriptions',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        plan_id: propsValue.planId,
      },
    });
    return response.body;
  },
});
