import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareMoney } from '../common/money';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const adjustInventoryAction = createAction({
  name: 'adjust_inventory',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Adjust Inventory',
  description: 'Adds or removes stock for an item variation. Needs a connection created or reconnected with piece version 1.0.0 or later.',
  audience: 'human',
  aiMetadata: {
    description: 'Adds or removes stock for a variation picked from lists; agents use Adjust Inventory (by ID). A retried step in the same run is not applied twice; a new run adjusts again.',
    idempotent: false,
  },
  props: {
    item: squareProps.catalogItem({ required: true }),
    variation_id: squareProps.variation({ required: true }),
    location_id: squareProps.location({ required: true }),
    reason: reasonProp(),
    quantity: Property.ShortText({ displayName: 'Quantity', description: 'How many units to add or remove, for example 5 or 1.5.', required: true }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.inventoryCounts,
  async run(context) {
    const p = context.propsValue;
    const change = squareOps.adjustmentChange({
      variationId: squareInputs.requireId({ value: p.variation_id, label: 'Variation' }),
      locationId: squareInputs.requireId({ value: p.location_id, label: 'Location' }),
      quantity: squareMoney.quantity({ value: p.quantity, label: 'Quantity' }),
      reason: squareInputs.requireText({ value: p.reason, label: 'Reason' }),
    });
    return squareIdempotency.execute({ context, action: 'adjust_inventory', input: change, send: ({ idempotencyKey }) => squareOps.changeInventory({ auth: context.auth, change: { ...change, adjustment: { ...change.adjustment, occurred_at: new Date().toISOString() } }, idempotencyKey }) });
  },
});

function reasonProp() {
  return Property.StaticDropdown({
    displayName: 'Reason',
    required: true,
    defaultValue: 'RECEIVED',
    options: {
      options: [
        { label: 'Stock received (adds)', value: 'RECEIVED' },
        { label: 'Sold (removes)', value: 'SOLD' },
        { label: 'Damaged / waste (removes)', value: 'WASTE' },
      ],
    },
  });
}

export const inventoryReasonProp = reasonProp;
