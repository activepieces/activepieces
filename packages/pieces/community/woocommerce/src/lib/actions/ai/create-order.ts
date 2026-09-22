import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { createOrderOutputSchema } from '../../output-schemas';
import { wooCreateOrder } from '../create-order';

export const wooAiCreateOrder = createAction({
  name: 'create_order',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Create an order with one or more line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new order from product ids and quantities, optionally for a customer and with a status; get product ids from list_products (a variation id can be used as the product id), customer ids from list_customers and payment method names from list_payment_gateways. Status processing or completed reduces stock and emails the customer, while pending (the default) does neither. Each call creates a separate order.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createOrderOutputSchema,
  props: wooCreateOrder.props,
  run: wooCreateOrder.run,
});
