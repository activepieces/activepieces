import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getLptPrice = createAction({
  name: 'get_lpt_price',
  displayName: 'Get LPT Price',
  description: 'Get LPT token price, market cap, 24h volume, and 24h price change from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/livepeer',
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
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const totalVolume = marketData['total_volume'] as Record<string, number>;

    return {
      name: data['name'],
      symbol: (data['symbol'] as string)?.toUpperCase(),
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      volume_24h_usd: totalVolume?.['usd'],
      price_change_24h_percent: marketData['price_change_percentage_24h'],
      last_updated: marketData['last_updated'],
    };
  },
});
