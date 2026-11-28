import { createAction } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const listOrderItemsAction = createAction({
  auth: sallaAuth,
  name: 'list_order_items',
  classification: 'READ',
  displayName: 'List Order Items',
  description: 'Lists the products in an order, with quantities, options and amounts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the line items of one Salla order (name, SKU, quantity, options, amounts) by its internal order ID (2116149737). Use it when you need only the items; use Get Order for the order header and items together. Read-only, safe to retry, returns up to 500 items.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.orderItems,
  props: {
    order: sallaProps.order({ required: true }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.listOrderItems({ auth, orderId: propsValue.order });
  },
});
