import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { pinchPaymentsClient } from '../common/client';

export const findSubscriptionAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'find_subscription',
  displayName: 'Find Subscription',
  description: 'Find a subscription using the Subscription ID',
  props: {
    subscriptionId: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The Subscription ID in sub_XXXXXXXXXXXXXX format',
      required: true,
    }),
  },
  async run(context) {
    const { subscriptionId } = context.propsValue;

    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
      environment: context.auth.props.environment
    };
    
    return pinchPaymentsClient(credentials, HttpMethod.GET, `/subscriptions/${subscriptionId}`);
  },
});
