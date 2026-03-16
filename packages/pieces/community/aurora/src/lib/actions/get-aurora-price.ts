import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAuroraPrice = createAction({
  name: 'get_aurora_price',
  displayName: 'Get Aurora Price',
  description: 'Get current AURORA token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/aurora-near',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, unknown> | undefined;
    const priceChangePercentage24h = marketData?.['price_change_percentage_24h'];
    const marketCap = marketData?.['market_cap'] as Record<string, unknown> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, unknown> | undefined;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price_usd: currentPrice?.['usd'],
      price_change_percentage_24h: priceChangePercentage24h,
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      last_updated: (marketData?.['last_updated']) as string | undefined,
    };
  },
});
