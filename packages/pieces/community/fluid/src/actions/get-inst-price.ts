import { createAction } from '@activepieces/pieces-framework';
import { makeRequest, COINGECKO_BASE } from '../lib/fluid-api';

export const getInstPrice = createAction({
  name: 'get_inst_price',
  displayName: 'Get INST Token Price',
  description: 'Get current INST governance token price, market cap, 24h volume, and price changes from CoinGecko.',
  props: {},
  async run() {
    const data = await makeRequest('/coins/instadapp', COINGECKO_BASE);
    const market = data.market_data || {};
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      current_price_usd: market.current_price?.usd,
      market_cap_usd: market.market_cap?.usd,
      total_volume_usd: market.total_volume?.usd,
      price_change_24h: market.price_change_percentage_24h,
      price_change_7d: market.price_change_percentage_7d,
      price_change_30d: market.price_change_percentage_30d,
      ath_usd: market.ath?.usd,
      circulating_supply: market.circulating_supply,
      total_supply: market.total_supply,
    };
  },
});
