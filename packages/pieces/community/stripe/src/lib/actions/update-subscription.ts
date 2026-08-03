import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { subscriptionOutputSchema } from '../output-schemas';
export const stripeUpdateSubscription = createAction({
  name: 'update_subscription',
  auth: stripeAuth,
  displayName: 'Update Subscription (Agent)',
  description: 'Update an existing Stripe subscription.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing subscription: change its items (price + quantity), proration behavior, metadata, or schedule cancellation at period end. To cancel outright use Cancel Subscription. Only the fields you supply change. Idempotent: re-applying the same update converges.',
    idempotent: true,
  },
  props: {
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      description:
        'The subscription ID (e.g., sub_...). Obtain it from List/Search Subscriptions.',
      required: true,
    }),
    items: Property.Array({
      displayName: 'Items',
      description:
        'New/updated items. To modify an existing item include its subscription-item id; to add one supply a price.',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Subscription Item ID',
          description:
            'Existing item id (si_...) to update. Obtain it from List Subscription Items.',
          required: false,
        }),
        price: Property.ShortText({
          displayName: 'Price ID',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          required: false,
        }),
      },
    }),
    proration_behavior: Property.StaticDropdown({
      displayName: 'Proration Behavior',
      required: false,
      options: {
        options: [
          { label: 'Create Prorations', value: 'create_prorations' },
          { label: 'None', value: 'none' },
          { label: 'Always Invoice', value: 'always_invoice' },
        ],
      },
    }),
    cancel_at_period_end: Property.Checkbox({
      displayName: 'Cancel at Period End',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
    }),
  },
  outputSchema: subscriptionOutputSchema,
  async run(context) {
    const {
      subscription_id,
      items,
      proration_behavior,
      cancel_at_period_end,
      metadata,
    } = context.propsValue;

    const body: { [key: string]: unknown } = {};
    if (proration_behavior) body.proration_behavior = proration_behavior;
    if (cancel_at_period_end !== undefined) {
      body.cancel_at_period_end = cancel_at_period_end;
    }
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }
    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        const typed = item as {
          id?: string;
          price?: string;
          quantity?: number;
        };
        if (typed.id) body[`items[${index}][id]`] = typed.id;
        if (typed.price) body[`items[${index}][price]`] = typed.price;
        if (typed.quantity !== undefined && typed.quantity !== null) {
          body[`items[${index}][quantity]`] = typed.quantity;
        }
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/subscriptions/${subscription_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
