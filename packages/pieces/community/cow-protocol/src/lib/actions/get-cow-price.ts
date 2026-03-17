import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getCowPrice = createAction({
  name: 'get_cow_price',
  displayName: 'Get COW Token Price',
  description: 'Get the current COW governance token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/cow-protocol',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, unknown> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, unknown> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, unknown> | undefined;
    const priceChange = marketData?.['price_change_percentage_24h'];
    const high24h = marketData?.['high_24h'] as Record<string, unknown> | undefined;
    const low24h = marketData?.['low_24h'] as Record<string, unknown> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_24h_percent: priceChange,
      high_24h_usd: high24h?.['usd'],
      low_24h_usd: low24h?.['usd'],
      last_updated: marketData?.['last_updated'],
    };
  },
});