import { createAction, Property } from '@activepieces/pieces-framework';
import { paywhirlAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const cancelSubscription = createAction({
  auth: paywhirlAuth,
  name: 'cancelSubscription',
  displayName: 'Cancel Subscription',
  description:
    "Cancel a customer's existing subscription. This will prevent the subscription from making any additional charges and unbind the customer from the plan.",
  props: {
    subscription_id: Property.Number({
      displayName: 'Subscription ID',
      description: 'Subscription ID',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Customer ID (can be used instead of subscription_id)',
      required: false,
    }),
  },
  async run(context) {
    const { subscription_id, customer_id } = context.propsValue;

    if (!subscription_id && !customer_id) {
      throw new Error('Either subscription_id or customer_id must be provided');
    }

    const body: any = {};

    if (subscription_id) {
      body.subscription_id = subscription_id;
    }
    if (customer_id) {
      body.customer_id = customer_id;
    }

    const response = await makeRequest(
      context.auth.props.api_key,
      context.auth.props.api_secret,
      HttpMethod.POST,
      '/unsubscribe/customer',
      body
    );

    return response;
  },
});
