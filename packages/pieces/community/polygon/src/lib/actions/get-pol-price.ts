import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getPolPrice = createAction({
  name: 'get_pol_price',
  displayName: 'Get POL Price',
  description: 'Fetch the current price, market cap, and 24h stats for POL (formerly MATIC) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/matic-network',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData
      ? (marketData['current_price'] as Record<string, unknown>)
      : {};
    const marketCap = marketData
      ? (marketData['market_cap'] as Record<string, unknown>)
      : {};
    const totalVolume = marketData
      ? (marketData['total_volume'] as Record<string, unknown>)
      : {};
    const priceChange24h = marketData
      ? marketData['price_change_percentage_24h']
      : null;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice['usd'],
      market_cap_usd: marketCap['usd'],
      total_volume_usd: totalVolume['usd'],
      price_change_24h_percent: priceChange24h,
      last_updated: data['last_updated'],
    };
  },
});
