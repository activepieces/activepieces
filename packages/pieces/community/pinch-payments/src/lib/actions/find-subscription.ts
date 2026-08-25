import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { pinchPaymentsClient } from '../common/client';

export const findSubscriptionAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'find_subscription',
  displayName: 'Find Subscription',
  description: 'Find a subscription using the Subscription ID',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single Pinch Payments subscription by its subscription id (sub_ prefix). Use to check the status or details of a known recurring subscription. Read-only and idempotent; requires a known subscription id (this does not list or search subscriptions).', idempotent: true },
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
