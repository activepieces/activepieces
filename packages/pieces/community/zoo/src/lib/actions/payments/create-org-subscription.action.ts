import { createAction, Property } from '@ensemble/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@ensemble/pieces-common';

export const createOrgSubscriptionAction = createAction({
  name: 'create_org_subscription',
  displayName: 'Create Organization Subscription',
  description: 'Create a new subscription for your organization',
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
        Authorization: `Bearer ${auth}`,
      },
      body: {
        plan_id: propsValue.planId,
      },
    });
    return response.body;
  },
});
