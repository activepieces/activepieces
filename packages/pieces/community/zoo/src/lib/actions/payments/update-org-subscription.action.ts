import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateOrgSubscriptionAction = createAction({
  name: 'update_org_subscription',
  displayName: 'Update Organization Subscription',
  description: 'Update the subscription for your organization',
  audience: 'both',
  aiMetadata: { description: 'Change the organization\'s existing subscription to the given plan ID. Use to switch the org\'s plan once a subscription exists; to start one from scratch use the create org subscription action. Not idempotent: it writes the plan and may trigger billing changes.', idempotent: false },
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
