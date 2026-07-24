import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { subscriptionItemListOutputSchema } from '../output-schemas';
export const stripeListSubscriptionItems = createAction({
  name: 'list_subscription_items',
  auth: stripeAuth,
  displayName: 'List Subscription Items (Agent)',
  description: 'List the line items of a subscription.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through the items of a single subscription, returning the subscription-item IDs (si_...) needed to update quantity or report usage. Use before Update Subscription when modifying a specific item. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      description:
        'The subscription ID (e.g., sub_...). Obtain it from List/Search Subscriptions.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: subscriptionItemListOutputSchema,
  async run(context) {
    const { subscription_id, limit } = context.propsValue;

    const queryParams: QueryParams = { subscription: subscription_id };
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/subscription_items`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
