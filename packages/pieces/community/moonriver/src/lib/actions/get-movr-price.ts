import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getMovrPrice = createAction({
  name: 'get_movr_price',
  displayName: 'Get MOVR Price',
  description:
    'Fetch the current MOVR token price, market cap, and 24h volume via CoinGecko. No API key required.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/moonriver',
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as
      | Record<string, number>
      | undefined;
    const marketCap = marketData?.['market_cap'] as
      | Record<string, number>
      | undefined;
    const totalVolume = marketData?.['total_volume'] as
      | Record<string, number>
      | undefined;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      volume_24h_usd: totalVolume?.['usd'],
      price_change_24h_pct: marketData?.['price_change_percentage_24h'] as
        | number
        | undefined,
      last_updated: data['last_updated'],
    };
  },
});
