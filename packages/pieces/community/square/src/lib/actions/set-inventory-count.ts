import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareMoney } from '../common/money';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const setInventoryCountAction = createAction({
  name: 'set_inventory_count',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Set Inventory Count',
  description: 'Sets the in-stock count of an item variation after a stock take. Needs a connection created or reconnected with piece version 1.0.0 or later.',
  audience: 'human',
  aiMetadata: {
    description: 'Sets the absolute in-stock count of a variation picked from lists; agents use Set Inventory Count (by ID). Setting the same count again is safe.',
    idempotent: true,
  },
  props: {
    item: squareProps.catalogItem({ required: true }),
    variation_id: squareProps.variation({ required: true }),
    location_id: squareProps.location({ required: true }),
    quantity: Property.ShortText({ displayName: 'Quantity In Stock', description: 'The counted number of units, for example 12.', required: true }),
  },
  outputSchema: squareOutputSchemas.inventoryCounts,
  async run(context) {
    const p = context.propsValue;
    const change = squareOps.physicalCountChange({
      variationId: squareInputs.requireId({ value: p.variation_id, label: 'Variation' }),
      locationId: squareInputs.requireId({ value: p.location_id, label: 'Location' }),
      quantity: squareMoney.quantity({ value: p.quantity, label: 'Quantity In Stock', allowZero: true }),
    });
    return squareIdempotency.execute({ context, action: 'set_inventory_count', input: change, send: ({ idempotencyKey }) => squareOps.changeInventory({ auth: context.auth, change: { ...change, physical_count: { ...change.physical_count, occurred_at: new Date().toISOString() } }, idempotencyKey }) });
  },
});
