import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getFraxPrice = createAction({
  name: 'get_frax_price',
  displayName: 'Get FRAX Price',
  description: 'Get the current FRAX token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/frax',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'];

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      price_change_percentage_24h: priceChange24h,
      last_updated: data['last_updated'],
    };
  },
});
