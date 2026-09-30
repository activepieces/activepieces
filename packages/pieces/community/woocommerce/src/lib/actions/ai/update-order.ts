import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { updateOrderOutputSchema } from '../../output-schemas';
import { wooUpdateOrder } from '../update-order';

export const wooAiUpdateOrder = createAction({
  name: 'update_order',
  classification: 'WRITE',
  displayName: 'Update Order',
  description: 'Change the status, customer note or transaction ID of an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the status, customer-provided note field or transaction id of one order; fields left empty are kept. Status changes have side effects: processing and completed email the customer, and refunded records a refund for the remaining amount and emails the customer, but moves no money and does not restock (use create_order_refund for partial refunds). The customer note field sends nothing; to message the customer use add_order_note.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateOrderOutputSchema,
  props: wooUpdateOrder.props,
  run: wooUpdateOrder.run,
});
