import { createAction } from '@activepieces/pieces-framework';
import { eulerRequest } from '../euler-api';

export const getEulerPrice = createAction({
  name: 'get_euler_price',
  displayName: 'Get EUL Token Price',
  description: 'Get EUL token price, market cap, and 24h volume from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const data = await eulerRequest('https://api.coingecko.com/api/v3/coins/euler');
    return {
      name: data.name,
      symbol: data.symbol,
      currentPrice: data.market_data?.current_price?.usd,
      marketCap: data.market_data?.market_cap?.usd,
      volume24h: data.market_data?.total_volume?.usd,
      priceChange24h: data.market_data?.price_change_percentage_24h,
      priceChange7d: data.market_data?.price_change_percentage_7d,
      circulatingSupply: data.market_data?.circulating_supply,
      totalSupply: data.market_data?.total_supply,
    };
  },
});
