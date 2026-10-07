import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareIdempotency } from '../../common/idempotency';
import { squareInputs } from '../../common/inputs';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';

export const createOrderByIdAction = createAction({
  name: 'create_order_by_id',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Create Order (by ID)',
  description: 'Creates an open order from variation IDs or custom items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an OPEN Square order (no payment taken). Each line item is either a catalog variation ID (from Search Catalog Items) with a quantity, or a custom name plus a decimal price like "12.50" in the location currency. Orders cannot be deleted, only canceled with Update Order State. A retried step in the same run returns the same order; a new run creates another.',
    idempotent: false,
  },
  props: {
    location_id: squareProps.locationIdText(),
    customer_id: Property.ShortText({ displayName: 'Customer ID', description: 'Optional, from Find Customers.', required: false }),
    line_items: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        variation_id: Property.ShortText({ displayName: 'Variation ID', description: 'Catalog item variation ID. Leave empty for a custom item.', required: false }),
        name: Property.ShortText({ displayName: 'Custom Name', required: false }),
        price: Property.ShortText({ displayName: 'Price', description: 'Unit price as a decimal, required for a custom item; optional override for a catalog item.', required: false }),
        quantity: Property.ShortText({ displayName: 'Quantity', description: 'Whole number, defaults to 1.', required: false }),
        note: Property.ShortText({ displayName: 'Note', required: false }),
      },
    }),
    reference_id: Property.ShortText({ displayName: 'Reference ID', required: false }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.order,
  async run(context) {
    const p = context.propsValue;
    const input = { location_id: p.location_id, customer_id: p.customer_id, items: p.line_items, reference_id: p.reference_id };
    return squareOps.createOrder({
      auth: context.auth,
      locationId: squareInputs.optionalId({ value: p.location_id, label: 'Location ID' }),
      customerId: squareInputs.optionalId({ value: p.customer_id, label: 'Customer ID' }),
      referenceId: squareInputs.text(p.reference_id),
      items: p.line_items,
      idempotencyKey: squareIdempotency.fromContext({ context, action: 'create_order', input }),
    });
  },
});
