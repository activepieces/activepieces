import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Get SIS token price, market cap, and 24h trading volume from CoinGecko',
  props: {
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The currency to display prices in (e.g. usd, eur, btc)',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(ctx) {
    const currency = (ctx.propsValue.currency || 'usd').toLowerCase();
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/symbiosis-finance',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const totalVolume = marketData['total_volume'] as Record<string, number>;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price: currentPrice[currency],
      market_cap: marketCap[currency],
      total_volume: totalVolume[currency],
      price_change_24h: marketData['price_change_24h'],
      price_change_percentage_24h: marketData['price_change_percentage_24h'],
      market_cap_rank: marketData['market_cap_rank'],
      last_updated: marketData['last_updated'],
    };
  },
});
