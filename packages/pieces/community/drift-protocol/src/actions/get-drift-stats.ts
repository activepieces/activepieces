import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_API_BASE } from '../lib/drift-api';

export const getDriftStats = createAction({
  name: 'get_drift_stats',
  displayName: 'Get Drift Stats',
  description: 'Get DRIFT token price, market cap, and 24h volume from CoinGecko',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COINGECKO_API_BASE}/simple/price?ids=drift-protocol&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`,
    });
    return response.body;
  },
});
