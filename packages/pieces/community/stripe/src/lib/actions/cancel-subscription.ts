import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const cancelSubscription = createAction({
  auth: stripeAuth,
  name: 'cancelSubscription',
  displayName: 'Cancel Subscription',
  description: 'Cancel an existing subscription immediately or at period end.',
  props: {
    subscriptionId: Property.ShortText({
      displayName: 'Subscription ID',
      required: true,
    }),
    at_period_end: Property.Checkbox({
      displayName: 'Cancel at Period End',
      required: false,
      defaultValue: false,
      description: 'If true, cancels at period end. If false, cancels immediately.',
    }),
  },
  async run({ auth, propsValue }) {
    const { subscriptionId, at_period_end } = propsValue;

    const body: Record<string, any> = {};
    if (at_period_end !== undefined) {
      body.at_period_end = at_period_end;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});