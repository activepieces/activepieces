import { createAction } from '@activepieces/pieces-framework';
import { lyraRequest } from '../lyra-api';

export const getLyraPrice = createAction({
  name: 'get_lyra_price',
  displayName: 'Get LYRA Token Price',
  description: 'Fetch LYRA token price, market cap, and 24h volume from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const data = await lyraRequest('https://api.coingecko.com/api/v3/coins/lyra-finance');
    const usd = data.market_data?.current_price?.usd;
    const marketCap = data.market_data?.market_cap?.usd;
    const volume24h = data.market_data?.total_volume?.usd;
    const priceChange24h = data.market_data?.price_change_percentage_24h;
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price_usd: usd,
      market_cap_usd: marketCap,
      volume_24h_usd: volume24h,
      price_change_24h_pct: priceChange24h,
      last_updated: data.last_updated,
    };
  },
});
