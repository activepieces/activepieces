import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareIdempotency } from '../../common/idempotency';
import { squareInputs } from '../../common/inputs';
import { squareMoney } from '../../common/money';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';

export const setInventoryCountByIdAction = createAction({
  name: 'set_inventory_count_by_id',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Set Inventory Count (by ID)',
  description: 'Sets the in-stock count of an item variation by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records a physical count: sets the IN_STOCK quantity of one variation at one location to an absolute number (0 allowed). Use Adjust Inventory (by ID) for relative changes. Needs INVENTORY_WRITE (reconnect older connections). Setting the same count again is safe to retry.',
    idempotent: true,
  },
  props: {
    variation_id: squareProps.idText({ displayName: 'Variation ID', description: 'Item variation ID from Search Catalog Items.' }),
    location_id: squareProps.idText({ displayName: 'Location ID', description: 'From List Locations.' }),
    quantity: Property.ShortText({ displayName: 'Quantity In Stock', description: 'The counted number of units, for example 12.', required: true }),
  },
  outputSchema: squareOutputSchemas.inventoryCounts,
  async run(context) {
    const p = context.propsValue;
    const change = squareOps.physicalCountChange({
      variationId: squareInputs.requireId({ value: p.variation_id, label: 'Variation ID' }),
      locationId: squareInputs.requireId({ value: p.location_id, label: 'Location ID' }),
      quantity: squareMoney.quantity({ value: p.quantity, label: 'Quantity In Stock', allowZero: true }),
    });
    const idempotencyKey = squareIdempotency.fromContext({ context, action: 'set_inventory_count', input: change });
    return squareOps.changeInventory({ auth: context.auth, change: { ...change, physical_count: { ...change.physical_count, occurred_at: new Date().toISOString() } }, idempotencyKey });
  },
});
