import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listDiscountRedemptions = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_discount_redemptions',
  displayName: 'List Discount Redemptions',
  description: 'List the orders that used a discount.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy discount redemptions (one per order that used a code, with the amount saved in cents), optionally filtered by discount ID or order ID, with page-based pagination. Use to measure how a promotion performed or to check which code an order used. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.discountRedemption, itemLabel: 'discount_code' }),
  props: {
    discountId: Property.ShortText({ displayName: 'Discount ID', description: 'Only redemptions of this discount.', required: false }),
    orderId: Property.ShortText({ displayName: 'Order ID', description: 'Only redemptions on this order.', required: false }),
    ...pageProps('redemptions'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/discount-redemptions',
      query: {
        'filter[discount_id]': optionalId({ value: propsValue.discountId, label: 'Discount ID' }),
        'filter[order_id]': optionalId({ value: propsValue.orderId, label: 'Order ID' }),
        ...pageParams(propsValue),
      },
    });
  },
});
