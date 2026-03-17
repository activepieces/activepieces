import { createAction } from '@activepieces/pieces-framework';
import { getTokenPrice } from '../compound-finance-api';

export const getCompPriceAction = createAction({
  name: 'get_comp_price',
  displayName: 'Get COMP Token Price',
  description: 'Fetches the live COMP token price, market cap, and 24h trading volume from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getTokenPrice();
    return {
      symbol: data.symbol,
      name: data.name,
      price_usd: data.current_price,
      market_cap_usd: data.market_cap,
      volume_24h_usd: data.total_volume,
      price_change_24h_percent: data.price_change_percentage_24h,
      price_change_7d_percent: data.price_change_percentage_7d,
      circulating_supply: data.circulating_supply,
      total_supply: data.total_supply,
      max_supply: data.max_supply,
      all_time_high_usd: data.ath,
      all_time_low_usd: data.atl,
      last_updated: data.last_updated,
    };
  },
});
