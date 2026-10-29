import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listOrderItems = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_order_items',
  displayName: 'List Order Items',
  description: 'List order items, filtered by order, product or variant.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy order items (the product and variant lines of orders), optionally filtered by order ID, product ID or variant ID, with page-based pagination. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.orderItem, itemLabel: 'product_name' }),
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'Only items of this order.',
      required: false,
    }),
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'Only items of this product.',
      required: false,
    }),
    variantId: Property.ShortText({
      displayName: 'Variant ID',
      description: 'Only items of this variant.',
      required: false,
    }),
    ...pageProps('order items'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/order-items',
      query: {
        'filter[order_id]': optionalId({ value: propsValue.orderId, label: 'Order ID' }),
        'filter[product_id]': optionalId({ value: propsValue.productId, label: 'Product ID' }),
        'filter[variant_id]': optionalId({ value: propsValue.variantId, label: 'Variant ID' }),
        ...pageParams(propsValue),
      },
    });
  },
});
