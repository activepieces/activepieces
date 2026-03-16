import { createAction } from '@activepieces/pieces-framework';
import { notionalRequest } from '../notional-api';

export const getNotePrice = createAction({
  name: 'get_note_price',
  displayName: 'Get NOTE Token Price',
  description: 'Get NOTE token price, market cap, and 24h volume from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const data = await notionalRequest(
      'https://api.coingecko.com/api/v3/coins/notional-finance'
    );
    return {
      name: data.name,
      symbol: data.symbol,
      currentPrice: data.market_data?.current_price?.usd,
      marketCap: data.market_data?.market_cap?.usd,
      volume24h: data.market_data?.total_volume?.usd,
      priceChange24h: data.market_data?.price_change_percentage_24h,
      lastUpdated: data.last_updated,
    };
  },
});
