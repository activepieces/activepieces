import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { getOrderOutputSchema } from '../../output-schemas';
import { wooGetOrder } from '../get-order';

export const wooAiGetOrder = createAction({
  name: 'get_order',
  classification: 'READ',
  displayName: 'Get Order',
  description: 'Get an order by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one order by its numeric id with status, totals, line items, addresses, payment method and refunds. To find orders by status, customer or date use list_orders. Read-only and safe to retry.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: getOrderOutputSchema,
  props: wooGetOrder.props,
  run: wooGetOrder.run,
});
