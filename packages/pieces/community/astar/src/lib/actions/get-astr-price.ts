import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAstrPrice = createAction({
  name: 'get_astr_price',
  displayName: 'Get ASTR Price',
  description: 'Fetch the current price and market data for ASTR token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/astar',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData ? (marketData['current_price'] as Record<string, unknown>) : undefined;
    const priceChangePercent = marketData ? (marketData['price_change_percentage_24h'] as number) : undefined;
    const marketCap = marketData ? (marketData['market_cap'] as Record<string, unknown>) : undefined;
    const volume24h = marketData ? (marketData['total_volume'] as Record<string, unknown>) : undefined;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice ? currentPrice['usd'] : null,
      price_change_24h_percent: priceChangePercent ?? null,
      market_cap_usd: marketCap ? marketCap['usd'] : null,
      volume_24h_usd: volume24h ? volume24h['usd'] : null,
      last_updated: marketData ? marketData['last_updated'] : null,
    };
  },
});
