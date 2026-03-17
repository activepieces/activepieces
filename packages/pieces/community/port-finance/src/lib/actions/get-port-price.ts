import { createAction } from '@activepieces/pieces-framework';
import { getCoinGeckoData } from '../port-api';

export const getPortPrice = createAction({
  name: 'get_port_price',
  displayName: 'Get PORT Token Price',
  description: 'Fetch current price, market cap, and 24h volume for the PORT governance token from CoinGecko.',
  props: {},
  async run() {
    const data = await getCoinGeckoData();
    const market = data.market_data ?? {};
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price_usd: market.current_price?.usd,
      market_cap_usd: market.market_cap?.usd,
      total_volume_usd: market.total_volume?.usd,
      price_change_24h_pct: market.price_change_percentage_24h,
      ath_usd: market.ath?.usd,
      atl_usd: market.atl?.usd,
      circulating_supply: market.circulating_supply,
      total_supply: market.total_supply,
      last_updated: data.last_updated,
    };
  },
});
