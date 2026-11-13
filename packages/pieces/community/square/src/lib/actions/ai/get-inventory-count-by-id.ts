import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareInputs } from '../../common/inputs';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';

export const getInventoryCountByIdAction = createAction({
  name: 'get_inventory_count_by_id',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Inventory Count (by ID)',
  description: 'Gets stock counts for one or more item variations by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads current stock counts (quantity per location and state such as IN_STOCK) for up to 100 variation IDs, optionally limited to one location. A variation that was never counted returns no rows. Needs the INVENTORY_READ permission (reconnect older connections). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    variation_ids: Property.Array({ displayName: 'Variation IDs', description: 'Item variation IDs from Search Catalog Items.', required: true }),
    location_id: Property.ShortText({ displayName: 'Location ID', description: 'Leave empty for all locations.', required: false }),
    limit: squareProps.limitProp({ max: 1000, fallback: 100 }),
    cursor: squareProps.cursorProp(),
  },
  outputSchema: squareOutputSchemas.inventoryCounts,
  async run(context) {
    const variationIds = squareInputs.idList({ value: context.propsValue.variation_ids, label: 'Variation IDs', max: 100 });
    const locationId = squareInputs.optionalId({ value: context.propsValue.location_id, label: 'Location ID' });
    return squareOps.getInventory({
      auth: context.auth,
      variationIds,
      locationIds: locationId ? [locationId] : [],
      limit: squareInputs.limit({ value: context.propsValue.limit, fallback: 100, max: 1000 }),
      cursor: squareInputs.cursor(context.propsValue.cursor),
    });
  },
});
