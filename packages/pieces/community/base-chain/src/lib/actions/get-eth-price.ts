import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getEthPrice = createAction({
  name: 'get_eth_price',
  displayName: 'Get ETH Price',
  description: 'Fetch the current ETH price from CoinGecko. Base uses ETH as its native gas token.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/ethereum',
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
    const priceChange = marketData['price_change_percentage_24h'] as number;
    const marketCap = (marketData['market_cap'] as Record<string, number>)['usd'];
    const volume = (marketData['total_volume'] as Record<string, number>)['usd'];

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice['usd'],
      price_change_24h_pct: priceChange,
      market_cap_usd: marketCap,
      total_volume_usd: volume,
      last_updated: data['last_updated'],
    };
  },
});
