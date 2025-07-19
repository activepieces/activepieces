import { createAction } from '@ensemble/pieces-framework';
import { shopifyAuth } from '../..';
import { getLocations } from '../common';

export const getLocationsAction = createAction({
  auth: shopifyAuth,
  name: 'get_locations',
  displayName: 'Get Locations',
  description: `Get locations.`,
  props: {},
  async run({ auth }) {
    return await getLocations(auth);
  },
});
