import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getNextPrice = createAction({
  name: 'get-next-price',
  displayName: 'Get NEXT Token Price',
  description: 'Get the current price and market data for the NEXT governance token from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/connext',
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
    const currentPrice = marketData ? (marketData['current_price'] as Record<string, unknown>) : undefined;
    const priceChangePercent = marketData ? (marketData['price_change_percentage_24h'] as number) : undefined;
    const marketCap = marketData ? (marketData['market_cap'] as Record<string, unknown>) : undefined;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice ? currentPrice['usd'] : null,
      market_cap_usd: marketCap ? marketCap['usd'] : null,
      price_change_24h_percent: priceChangePercent ?? null,
      last_updated: marketData ? marketData['last_updated'] : null,
    };
  },
});
