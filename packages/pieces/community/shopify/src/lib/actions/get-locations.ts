import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getLocations } from '../common';

export const getLocationsAction = createAction({
  auth: shopifyAuth,
  name: 'get_locations',
  displayName: 'Get Locations',
  description: `Get locations.`,
  audience: 'both',
  aiMetadata: { description: 'List all store locations (warehouses, retail outlets) configured in Shopify, with no input required. Use to discover location IDs needed by inventory actions such as Adjust Inventory Level. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    return await getLocations(auth);
  },
});
