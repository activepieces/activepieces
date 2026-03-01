import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { adjustInventoryLevel } from '../common';

export const adjustInventoryLevelAction = createAction({
  auth: shopifyAuth,
  name: 'adjust_inventory_level',
  displayName: 'Adjust Inventory Level',
  description: `Adjust inventory level of an item at a location.`,
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
