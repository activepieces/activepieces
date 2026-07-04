import { Property, createAction } from '@activepieces/pieces-framework';
import { getOrder } from '../api';
import { cartloomAuth } from '../auth';

export const getOrderAction = createAction({
  name: 'get_order',
  auth: cartloomAuth,
  displayName: 'Get Order',
  description: 'Get an order from Cartloom',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single Cartloom order by its invoice ID. Use when you already know the exact invoice ID and want that one order; to find orders without an invoice ID, use the date- or email-based order search instead. Read-only and idempotent.', idempotent: true },
  props: {
    invoice: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The invoice ID for the order you want to retrieve',
      required: true,
    }),
  },
  async run(context) {
    return await getOrder(context.auth.props, context.propsValue.invoice);
  },
});
