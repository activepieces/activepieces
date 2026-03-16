import { createAction } from '@activepieces/pieces-framework';
import { fetchCoinGecko } from '../common/dodo-api';

export const getDodoPrice = createAction({
  name: 'get-dodo-price',
  displayName: 'Get DODO Price',
  description: 'Get DODO token price and market data from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchCoinGecko();
    const market = data.market_data;

    return {
      current_price: market.current_price.usd,
      market_cap: market.market_cap.usd,
      price_change_percentage_24h: market.price_change_percentage_24h,
      total_volume: market.total_volume.usd,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
    };
  },
});