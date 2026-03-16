import { createAction } from '@activepieces/pieces-framework';
import { getCoinGeckoPrice } from '../alchemix-api';

export const getAlcxPrice = createAction({
  name: 'get_alcx_price',
  displayName: 'Get ALCX Price',
  description: 'Get ALCX governance token price and market data from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const data = await getCoinGeckoPrice('alchemix');
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
