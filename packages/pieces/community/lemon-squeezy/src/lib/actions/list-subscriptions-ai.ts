import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listSubscriptionsAi = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_subscriptions_ai',
  displayName: 'List Subscriptions (AI)',
  description: 'List subscriptions filtered by IDs, email or status.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy subscriptions filtered by any of: store ID, order ID, order item ID, product ID, variant ID, exact customer email, status (on_trial, active, paused, past_due, unpaid, cancelled, expired). Page-based; check has_more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.subscription, itemLabel: 'user_email' }),
  props: {
    storeId: Property.ShortText({
      displayName: 'Store ID',
      description: 'Numeric store ID.',
      required: false,
    }),
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'Numeric order ID.',
      required: false,
    }),
    orderItemId: Property.ShortText({
      displayName: 'Order Item ID',
      description: 'Numeric order item ID.',
      required: false,
    }),
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'Numeric product ID.',
      required: false,
    }),
    variantId: Property.ShortText({
      displayName: 'Variant ID',
      description: 'Numeric variant ID.',
      required: false,
    }),
    userEmail: Property.ShortText({ displayName: 'Customer Email', description: 'Exact customer email address.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'On Trial', value: 'on_trial' },
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Past Due', value: 'past_due' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Expired', value: 'expired' },
        ],
      },
    }),
    ...pageProps('subscriptions'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/subscriptions',
      query: {
        'filter[store_id]': optionalId({ value: propsValue.storeId, label: 'Store ID' }),
        'filter[order_id]': optionalId({ value: propsValue.orderId, label: 'Order ID' }),
        'filter[order_item_id]': optionalId({ value: propsValue.orderItemId, label: 'Order Item ID' }),
        'filter[product_id]': optionalId({ value: propsValue.productId, label: 'Product ID' }),
        'filter[variant_id]': optionalId({ value: propsValue.variantId, label: 'Variant ID' }),
        'filter[user_email]': propsValue.userEmail?.trim() || undefined,
        'filter[status]': propsValue.status ?? undefined,
        ...pageParams(propsValue),
      },
    });
  },
});
