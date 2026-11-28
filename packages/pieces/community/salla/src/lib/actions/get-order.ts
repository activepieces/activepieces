import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const getOrderAction = createAction({
  auth: sallaAuth,
  name: 'get_order',
  classification: 'READ',
  displayName: 'Get Order',
  description: 'Gets one order by ID, with its line items if you want them.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Salla order by its internal order ID (2116149737, not the reference number 41027662 the customer sees), with its line items unless Include Items is off. Use Find Orders to look up an order by reference number, customer or status first, and List Order Items when you only need the items. Read-only and safe to retry; shipments are not included.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.getOrder,
  props: {
    order: sallaProps.order({ required: true }),
    include_items: Property.Checkbox({
      displayName: 'Include Items',
      description:
        'Also fetch the products in the order (name, SKU, quantity, amounts). Salla no longer returns items in the order details, so this costs one extra request. Turn it off when you only need the order totals and status.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.getOrder({
      auth,
      orderId: propsValue.order,
      includeItems: propsValue.include_items !== false,
    });
  },
});
