import { createAction } from '@activepieces/pieces-framework';
import { ribbonRequest } from '../ribbon-api';

export const getRbnPrice = createAction({
  name: 'get_rbn_price',
  displayName: 'Get RBN Token Price',
  description: 'Retrieve RBN token price, market cap, and 24h volume from CoinGecko.',
  props: {},
  async run() {
    const data = await ribbonRequest('https://api.coingecko.com/api/v3/coins/ribbon-finance');
    const marketData = data.market_data;
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      current_price_usd: marketData?.current_price?.usd,
      market_cap_usd: marketData?.market_cap?.usd,
      total_volume_usd: marketData?.total_volume?.usd,
      price_change_24h_percent: marketData?.price_change_percentage_24h,
      high_24h_usd: marketData?.high_24h?.usd,
      low_24h_usd: marketData?.low_24h?.usd,
      circulating_supply: marketData?.circulating_supply,
      total_supply: marketData?.total_supply,
      last_updated: marketData?.last_updated,
    };
  },
});
