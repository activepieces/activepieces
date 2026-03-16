import { createAction } from '@activepieces/pieces-framework';
import { getCoinGeckoPrice } from '../olympus-api';

export const getGohmPrice = createAction({
  name: 'get_gohm_price',
  displayName: 'Get gOHM Price',
  description: 'Get governance OHM (gOHM) token price and market data from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const data = await getCoinGeckoPrice('governance-ohm');
    const market = data.market_data;
    return {
      price_usd: market.current_price?.usd,
      market_cap_usd: market.market_cap?.usd,
      volume_24h_usd: market.total_volume?.usd,
      price_change_24h_pct: market.price_change_percentage_24h,
      circulating_supply: market.circulating_supply,
    };
  },
});
