import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { adjustInventoryLevel } from '../common';

export const adjustInventoryLevelAction = createAction({
  auth: shopifyAuth,
  name: 'adjust_inventory_level',
  classification: 'WRITE',
  displayName: 'Adjust Inventory Level',
  description: `Adjust inventory level of an item at a location.`,
  audience: 'both',
  aiMetadata: { description: 'Apply a relative change to an inventory item\'s available quantity at a specific location: positive values increase stock, negative values decrease it. Requires the inventory item ID, location ID, and a delta. Because the adjustment is relative (not an absolute set), each call shifts the count again, so it is not idempotent.', idempotent: false },
  propertyGroups: [
    {
      key: 'stock',
      display: 'section',
      label: 'Stock to adjust',
      icon: 'location',
      props: ['id', 'locationId', 'adjustment'],
    },
  ],
  props: {
    id: Property.Number({
      displayName: 'Inventory Item ID',
      description: "The variant's inventory_item_id, from Get Product Variant.",
      required: true,
      width: 'half',
    }),
    locationId: Property.Number({
      displayName: 'Location ID',
      description: 'Get it from a Get Locations step.',
      required: true,
      width: 'half',
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
