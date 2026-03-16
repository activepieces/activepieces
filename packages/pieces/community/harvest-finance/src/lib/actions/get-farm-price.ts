import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getFarmPrice = createAction({
  name: 'get_farm_price',
  displayName: 'Get FARM Token Price',
  description: 'Get the current price, market cap, and 24h change for the FARM governance token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/harvest-finance',
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'];
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      price_change_24h_pct: priceChange24h,
      last_updated: (marketData?.['last_updated']) ?? null,
    };
  },
});
