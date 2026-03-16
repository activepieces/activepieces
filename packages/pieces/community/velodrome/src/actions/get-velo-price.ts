import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/velodrome-api';

export const getVeloPrice = createAction({
  name: 'get_velo_price',
  displayName: 'Get VELO Price',
  description: 'Get VELO token price, market cap, and 24h volume via CoinGecko',
  auth: undefined,
  props: {},
  async run(_context) {
    const data = await fetchUrl(
      'https://api.coingecko.com/api/v3/simple/price?ids=velodrome-finance&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true'
    );

    const velo = data['velodrome-finance'] ?? {};

    return {
      token: 'VELO',
      priceUsd: velo.usd ?? null,
      marketCapUsd: velo.usd_market_cap ?? null,
      volume24hUsd: velo.usd_24h_vol ?? null,
      source: 'CoinGecko',
    };
  },
});
