import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { pagingProps } from '../common/props';
import { bigCommerceApiService } from '../common/requests';
import { orderProductListOutputSchema } from '../common/schemas';
import { parsePositiveIntId, validatePaging } from '../common/shared-runs';

export const listOrderProducts = createAction({
  auth: bigcommerceAuth,
  name: 'listOrderProducts',
  classification: 'READ',
  displayName: 'List Order Products',
  description: 'Lists the line items (products) of an order',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the line items of one BigCommerce order by numeric order_id: product id, name, SKU, quantity and prices. Returns an array; limit (1-250, default 50) and page (from 1) control paging, so request the next page while a page comes back full. Returns [] when the order has no line items. Read-only.',
    idempotent: true,
  },
  outputSchema: orderProductListOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Numeric BigCommerce order ID',
      required: true,
    }),
    ...pagingProps,
  },
  async run(context) {
    const { order_id, limit, page } = context.propsValue;
    const orderId = parsePositiveIntId({ value: order_id, field: 'Order ID' });
    const paging = validatePaging({ limit, page });
    return await bigCommerceApiService.fetchOrderProducts({
      auth: context.auth.props,
      orderId,
      query: { ...paging },
    });
  },
});
