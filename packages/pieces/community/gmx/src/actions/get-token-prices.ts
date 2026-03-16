import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_BASE_URL } from '../lib/gmx-api';

export const getTokenPrices = createAction({
  name: 'get_token_prices',
  displayName: 'Get Token Prices',
  description: 'Get GMX and GLP token prices from CoinGecko',
  auth: undefined,
  props: {},
  async run(_context) {
    // Fetch GMX token price with market data
    const gmxResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE_URL}/simple/price`,
      queryParams: {
        ids: 'gmx',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_vol: 'true',
        include_24hr_change: 'true',
      },
    });

    const gmxData = gmxResponse.body?.gmx ?? {};

    return {
      gmx: {
        usd: gmxData.usd,
        usd_market_cap: gmxData.usd_market_cap,
        usd_24h_vol: gmxData.usd_24h_vol,
        usd_24h_change: gmxData.usd_24h_change,
      },
      timestamp: new Date().toISOString(),
      source: 'coingecko',
    };
  },
});
