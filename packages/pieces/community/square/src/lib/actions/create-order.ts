import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const createOrderAction = createAction({
  name: 'create_order',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Create Order',
  description: 'Creates an open order (no payment is taken).',
  audience: 'human',
  aiMetadata: {
    description: 'Creates an OPEN Square order from items picked in lists; agents use Create Order (by ID). No payment is taken. A retried step returns the same order instead of repeating the write, and identical calls within one run (for example a loop with the same input) count as one; set Idempotency Key (for example to the loop item) to keep them separate. A new run writes again.',
    idempotent: false,
  },
  props: {
    location_id: squareProps.location({ required: false }),
    customer_id: squareProps.customer({ required: false, description: 'Optional. Type part of a name or email to search.' }),
    line_items: squareProps.lineItems(),
    reference_id: Property.ShortText({ displayName: 'Reference ID', description: 'Your own ID for this order, for example from your web shop.', required: false }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.order,
  async run(context) {
    const p = context.propsValue;
    const items = squareShape.isRecord(p.line_items) ? p.line_items['items'] : undefined;
    const input = { location_id: p.location_id, customer_id: p.customer_id, items, reference_id: p.reference_id };
    return squareIdempotency.execute({
      context,
      action: 'create_order',
      input,
      send: ({ idempotencyKey }) =>
        squareOps.createOrder({
          auth: context.auth,
          locationId: squareInputs.optionalId({ value: p.location_id, label: 'Location' }),
          customerId: squareInputs.optionalId({ value: p.customer_id, label: 'Customer' }),
          referenceId: squareInputs.text(p.reference_id),
          items,
          idempotencyKey,
        }),
    });
  },
});
