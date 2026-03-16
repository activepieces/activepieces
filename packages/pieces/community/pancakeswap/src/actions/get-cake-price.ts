import { createAction } from '@activepieces/pieces-framework';
import { makeRequest, COINGECKO_BASE } from '../lib/pancakeswap-api';

export const getCakePrice = createAction({
  name: 'get_cake_price',
  displayName: 'Get CAKE Price',
  description: 'Get CAKE token price, market cap, and 24h volume from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const data = await makeRequest(
      '/simple/price?ids=pancakeswap-token&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
      COINGECKO_BASE
    );

    const cake = data['pancakeswap-token'];

    if (!cake) {
      throw new Error('CAKE token data not found in CoinGecko response');
    }

    return {
      token: 'CAKE',
      coingeckoId: 'pancakeswap-token',
      priceUsd: cake.usd,
      marketCapUsd: cake.usd_market_cap,
      volume24hUsd: cake.usd_24h_vol,
      change24hPercent: cake.usd_24h_change,
      timestamp: new Date().toISOString(),
    };
  },
});
