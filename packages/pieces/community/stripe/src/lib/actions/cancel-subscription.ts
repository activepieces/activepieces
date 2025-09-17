import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCancelSubscription = createAction({
  name: 'cancel_subscription',
  auth: stripeAuth,
  displayName: 'Cancel Subscription',
  description:
    'Cancel an existing subscription, either immediately or at the end of the current billing period.',
  props: {
    subscription: stripeCommon.subscription, 
    cancel_at_period_end: Property.Checkbox({
      displayName: 'Cancel at Period End',
      description:
        'If true, the subscription will remain active until the end of the current billing period. If false, it will be canceled immediately.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { subscription, cancel_at_period_end } = context.propsValue;

    let request: HttpRequest;

    if (cancel_at_period_end) {
      request = {
        method: HttpMethod.POST,
        url: `${stripeCommon.baseUrl}/subscriptions/${subscription}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth,
        },
        body: {
          cancel_at_period_end: true,
        },
      };
    } else {
      request = {
        method: HttpMethod.DELETE,
        url: `${stripeCommon.baseUrl}/subscriptions/${subscription}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth,
        },
      };
    }

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
