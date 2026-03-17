import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getLarixPrice = createAction({
  name: 'get_larix_price',
  displayName: 'Get LARIX Price',
  description: 'Fetch the current price and market data for the LARIX governance token from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/larix',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData?.['current_price'] as Record<string, number>;
    const marketCap = marketData?.['market_cap'] as Record<string, number>;
    const totalVolume = marketData?.['total_volume'] as Record<string, number>;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_24h: marketData?.['price_change_percentage_24h'],
      price_change_7d: marketData?.['price_change_percentage_7d'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
