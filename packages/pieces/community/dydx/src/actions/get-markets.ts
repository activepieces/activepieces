import { createAction } from '@activepieces/pieces-framework';
import { dydxRequest } from '../lib/dydx-api';

export const getMarkets = createAction({
  name: 'get_markets',
  displayName: 'Get Perpetual Markets',
  description: 'Get all available perpetual markets on dYdX',
  auth: undefined,
  props: {},
  async run(context) {
    return await dydxRequest('/v4/perpetualMarkets', { limit: '100' });
  },
});
