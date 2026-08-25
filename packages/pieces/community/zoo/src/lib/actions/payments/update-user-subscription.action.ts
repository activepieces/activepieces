import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateUserSubscriptionAction = createAction({
  name: 'update_user_subscription',
  displayName: 'Update User Subscription',
  description: 'Update the subscription for your user account',
  audience: 'both',
  aiMetadata: { description: 'Change the subscription plan on the authenticated user\'s own Zoo account by setting it to the given plan ID. Use for the individual user, not the organization (use the org subscription action for that). Not idempotent: each call writes the plan and may trigger billing changes.', idempotent: false },
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
      method: HttpMethod.PUT,
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
