import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth, getPinchPaymentsToken } from '../common/auth';

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
    };

    const tokenResponse = await getPinchPaymentsToken(credentials);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.getpinch.com.au/test/subscriptions/${subscriptionId}`,
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
