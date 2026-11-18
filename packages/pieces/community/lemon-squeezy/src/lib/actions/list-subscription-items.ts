import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listSubscriptionItems = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_subscription_items',
  displayName: 'List Subscription Items',
  description: 'List the price items (quantity, usage-based) of subscriptions.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy subscription items (the price line of a subscription: price ID, quantity, whether it is usage-based), optionally filtered by subscription ID or price ID, with page-based pagination. Use to read a subscription\'s seat count or find the item ID that usage-based billing needs. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.subscriptionItem, itemLabel: 'id' }),
  props: {
    subscriptionId: Property.ShortText({ displayName: 'Subscription ID', description: 'Only items of this subscription.', required: false }),
    priceId: Property.ShortText({ displayName: 'Price ID', description: 'Only items on this price.', required: false }),
    ...pageProps('items'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/subscription-items',
      query: {
        'filter[subscription_id]': optionalId({ value: propsValue.subscriptionId, label: 'Subscription ID' }),
        'filter[price_id]': optionalId({ value: propsValue.priceId, label: 'Price ID' }),
        ...pageParams(propsValue),
      },
    });
  },
});
