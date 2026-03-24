import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest, cleanObject } from '../common/client';

type CreateSubscriptionProps = {
  customer_id: string;
  item_price_id: string;
  quantity?: number;
  auto_collection?: 'on' | 'off';
  billing_cycles?: number;
  trial_end?: number;
};

export const createSubscription = createAction({
  name: 'create_subscription',
  auth: chargebeeAuth,
  displayName: 'Create Subscription',
  description:
    'Create a subscription for an existing customer using a Chargebee item price.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
    item_price_id: Property.ShortText({
      displayName: 'Item Price ID',
      description: 'The Chargebee item price ID to subscribe the customer to.',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      required: false,
    }),
    auto_collection: Property.StaticDropdown({
      displayName: 'Auto Collection',
      required: false,
      options: {
        options: [
          { label: 'On', value: 'on' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),
    billing_cycles: Property.Number({
      displayName: 'Billing Cycles',
      description: 'Optional number of billing cycles before the subscription ends.',
      required: false,
    }),
    trial_end: Property.Number({
      displayName: 'Trial End (Unix Seconds)',
      description: 'Optional UTC timestamp in seconds to end the trial.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as CreateSubscriptionProps;

    const body = cleanObject({
      customer_id: props.customer_id,
      auto_collection: props.auto_collection,
      billing_cycles: props.billing_cycles,
      trial_end: props.trial_end,
      'subscription_items[item_price_id][0]': props.item_price_id,
      'subscription_items[quantity][0]': props.quantity,
    });

    return await chargebeeRequest({
      site: context.auth.props.site,
      apiKey: context.auth.props.api_key,
      method: HttpMethod.POST,
      path: '/subscriptions',
      contentType: 'application/x-www-form-urlencoded',
      body,
    });
  },
});
