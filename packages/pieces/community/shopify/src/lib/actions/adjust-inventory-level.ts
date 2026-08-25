import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { adjustInventoryLevel } from '../common';

export const adjustInventoryLevelAction = createAction({
  auth: shopifyAuth,
  name: 'adjust_inventory_level',
  displayName: 'Adjust Inventory Level',
  description: `Adjust inventory level of an item at a location.`,
  audience: 'both',
  aiMetadata: { description: 'Apply a relative change to an inventory item\'s available quantity at a specific location: positive values increase stock, negative values decrease it. Requires the inventory item ID, location ID, and a delta. Because the adjustment is relative (not an absolute set), each call shifts the count again, so it is not idempotent.', idempotent: false },
  props: {
    id: Property.Number({
      displayName: 'Inventory Item',
      description: 'The ID of the inventory item.',
      required: true,
    }),
    locationId: Property.Number({
      displayName: 'Location',
      description: 'The ID of the location.',
      required: true,
    }),
    adjustment: Property.Number({
      displayName: 'Adjustment',
      description:
        'Positive values increase inventory, negative values decrease it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { id, locationId, adjustment } = propsValue;

    return await adjustInventoryLevel(id, locationId, adjustment, auth);
  },
});
