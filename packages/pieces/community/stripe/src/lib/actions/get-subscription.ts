import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeGetSubscription = createAction({
  name: 'get_subscription',
  auth: stripeAuth,
  displayName: 'Get Subscription (Agent)',
  description: 'Retrieve a Stripe subscription by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe subscription by its subscription ID (e.g., sub_...). Use List/Search Subscriptions to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      description:
        'The subscription ID (e.g., sub_...). Obtain it from List/Search Subscriptions.',
      required: true,
    }),
  },
  async run(context) {
    const { subscription_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/subscriptions/${subscription_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
