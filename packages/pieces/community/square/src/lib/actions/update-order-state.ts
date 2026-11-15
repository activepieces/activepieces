import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareOutputSchemas } from '../output-schemas';

export const updateOrderStateAction = createAction({
  name: 'update_order_state',
  classification: 'DESTRUCTIVE',
  auth: squareAuth,
  displayName: 'Complete or Cancel Order',
  description: 'Marks an open order as completed or canceled.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moves an OPEN Square order to COMPLETED (needs all its payments completed) or CANCELED. Canceling cannot be undone. It reads the current version first. A retried step in the same run returns the same order; a later run on an order that is no longer OPEN fails without changing it.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({ displayName: 'Order ID', required: true }),
    state: Property.StaticDropdown({
      displayName: 'New State',
      required: true,
      options: {
        options: [
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Canceled', value: 'CANCELED' },
        ],
      },
    }),
  },
  outputSchema: squareOutputSchemas.order,
  async run(context) {
    const orderId = squareInputs.requireId({ value: context.propsValue.order_id, label: 'Order ID' });
    const state = squareInputs.requireText({ value: context.propsValue.state, label: 'New State' });
    if (state !== 'COMPLETED' && state !== 'CANCELED') {
      throw new Error('New State must be COMPLETED or CANCELED.');
    }
    return squareIdempotency.execute({ context, action: 'update_order_state', input: { orderId, state }, send: ({ idempotencyKey }) => squareOps.setOrderState({ auth: context.auth, orderId, state, idempotencyKey }) });
  },
});
