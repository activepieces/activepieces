import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { customerIdDropdown, subscriptionIdDropdown } from '../common';

export const cancelSubscription = createAction({
  auth: stripeAuth,
  name: 'cancelSubscription',
  displayName: 'Cancel Subscription',
  description: 'Cancel an existing subscription immediately or at period end.',
  props: {
    customerid: customerIdDropdown,
    subscriptionId: subscriptionIdDropdown,

  },
  async run({ auth, propsValue }) {
    const { subscriptionId, } = propsValue;



    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },

    });

    return response.body;
  },
});