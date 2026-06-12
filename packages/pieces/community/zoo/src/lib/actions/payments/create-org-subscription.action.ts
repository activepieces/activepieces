import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createOrgSubscriptionAction = createAction({
  name: 'create_org_subscription',
  displayName: 'Create Organization Subscription',
  description: 'Create a new subscription for your organization',
  audience: 'both',
  aiMetadata: { description: 'Start a new billing subscription for the organization using the given plan ID. Use when the org has no subscription yet; to change an existing one use the org subscription update action instead. Not idempotent: calling it creates a subscription and may initiate billing.', idempotent: false },
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
      url: 'https://api.zoo.dev/org/payment/subscriptions',
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
