import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const getInventoryCountAction = createAction({
  name: 'get_inventory_count',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Inventory Count',
  description: 'Gets the stock count of an item variation. Needs a connection created or reconnected with piece version 1.0.0 or later.',
  audience: 'human',
  aiMetadata: {
    description: 'Reads the stock count of a variation picked from lists; agents use Get Inventory Count (by ID). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    item: squareProps.catalogItem({ required: true }),
    variation_id: squareProps.variation({ required: true }),
    location_id: squareProps.location({ required: false, description: 'Leave empty to get the count at every location.' }),
  },
  outputSchema: squareOutputSchemas.inventoryCounts,
  async run(context) {
    const variationId = squareInputs.requireId({ value: context.propsValue.variation_id, label: 'Variation' });
    const locationId = squareInputs.optionalId({ value: context.propsValue.location_id, label: 'Location' });
    return squareOps.getInventory({ auth: context.auth, variationIds: [variationId], locationIds: locationId ? [locationId] : [], limit: 100, cursor: undefined });
  },
});
