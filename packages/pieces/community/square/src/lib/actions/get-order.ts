import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const getOrderAction = createAction({
  name: 'get_order',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Order',
  description: 'Gets an order with its line items and totals.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Square order by order ID (from an order trigger, Search Orders or a payment): state, customer, totals as decimal strings and up to 100 line items. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({ displayName: 'Order ID', description: 'Map it from the New Order trigger or a payment.', required: true }),
  },
  outputSchema: squareOutputSchemas.order,
  async run(context) {
    const orderId = squareInputs.requireId({ value: context.propsValue.order_id, label: 'Order ID' });
    const body = await squareClient.request<unknown>({ auth: context.auth, method: HttpMethod.GET, path: ['v2', 'orders', orderId], operation: `read order "${orderId}"` });
    return squareShape.order(squareShape.requireObject({ body, key: 'order', what: 'order' }));
  },
});
