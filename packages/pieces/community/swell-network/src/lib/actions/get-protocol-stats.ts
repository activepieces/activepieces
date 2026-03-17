import { createAction } from '@activepieces/pieces-framework';
import { getProtocolStats } from '../swell-api';

export const getProtocolStatsAction = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetches combined protocol stats for Swell Network — TVL (from DeFiLlama) and SWELL token price (from CoinGecko) in a single parallel request.',
  props: {},
  async run() {
    return await getProtocolStats();
  },
});
