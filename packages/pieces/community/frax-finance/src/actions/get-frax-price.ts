import { createAction } from '@activepieces/pieces-framework';
import { getFraxPriceData } from '../lib/frax-api';

export const getFraxPrice = createAction({
  name: 'get_frax_price',
  displayName: 'Get FRAX & FXS Price',
  description: 'Get FRAX stablecoin and FXS token price, market cap, and 24h volume from CoinGecko',
  props: {},
  async run() {
    const data = await getFraxPriceData() as Record<string, Record<string, number>>;

    const frax = data['frax'] ?? {};
    const fxs = data['frax-share'] ?? {};

    return {
      frax: {
        price_usd: frax['usd'],
        market_cap_usd: frax['usd_market_cap'],
        volume_24h_usd: frax['usd_24h_vol'],
      },
      fxs: {
        price_usd: fxs['usd'],
        market_cap_usd: fxs['usd_market_cap'],
        volume_24h_usd: fxs['usd_24h_vol'],
      },
      fetched_at: new Date().toISOString(),
    };
  },
});
