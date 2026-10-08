import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareIdempotency } from '../../common/idempotency';
import { squareInputs } from '../../common/inputs';
import { squareMoney } from '../../common/money';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';
import { inventoryReasonProp } from '../adjust-inventory';

export const adjustInventoryByIdAction = createAction({
  name: 'adjust_inventory_by_id',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Adjust Inventory (by ID)',
  description: 'Adds or removes stock for an item variation by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes stock relative to the current count: RECEIVED adds the quantity to IN_STOCK, SOLD or WASTE removes it. Use Set Inventory Count (by ID) to set an absolute count after a stock take. Needs INVENTORY_WRITE (reconnect older connections). A retried step returns the same change instead of repeating the write, and identical calls within one run (for example a loop with the same input) count as one; set Idempotency Key (for example to the loop item) to keep them separate. A new run writes again.',
    idempotent: false,
  },
  props: {
    variation_id: squareProps.idText({ displayName: 'Variation ID', description: 'Item variation ID from Search Catalog Items.' }),
    location_id: squareProps.idText({ displayName: 'Location ID', description: 'From List Locations.' }),
    reason: inventoryReasonProp(),
    quantity: Property.ShortText({ displayName: 'Quantity', description: 'Positive number of units, for example 5 or 1.5.', required: true }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.inventoryCounts,
  async run(context) {
    const p = context.propsValue;
    const change = squareOps.adjustmentChange({
      variationId: squareInputs.requireId({ value: p.variation_id, label: 'Variation ID' }),
      locationId: squareInputs.requireId({ value: p.location_id, label: 'Location ID' }),
      quantity: squareMoney.quantity({ value: p.quantity, label: 'Quantity' }),
      reason: squareInputs.requireText({ value: p.reason, label: 'Reason' }),
    });
    return squareIdempotency.execute({ context, action: 'adjust_inventory', input: change, send: ({ idempotencyKey }) => squareOps.changeInventory({ auth: context.auth, change: { ...change, adjustment: { ...change.adjustment, occurred_at: new Date().toISOString() } }, idempotencyKey }) });
  },
});
